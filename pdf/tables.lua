-- Render tables as styled longtables (see `styledtable` in header.tex): a
-- navy header band repeated on every page, zebra-striped body rows, padded
-- cells and a coloured bottom rule. Cells written as "• one<br>• two" become
-- a real bullet list so wrapped lines hang under the text, not the bullet.
-- Runs after table-widths.lua so it sees the adjusted column widths.
local ALIGN = {
  AlignLeft = { '\\raggedright', 'l' },
  AlignRight = { '\\raggedleft', 'r' },
  AlignCenter = { '\\centering', 'c' },
  AlignDefault = { '\\raggedright', 'l' },
}

local function latex (blocks)
  return (pandoc.write(pandoc.Pandoc(blocks), 'latex'):gsub('%s+$', ''))
end

-- Split inlines on LineBreak; nil unless every line starts with a bullet
local function bullet_items (blocks)
  if #blocks ~= 1 or (blocks[1].t ~= 'Plain' and blocks[1].t ~= 'Para') then
    return nil
  end
  local items, current = {}, nil
  for _, el in ipairs(blocks[1].content) do
    if el.t == 'LineBreak' then
      current = nil
    elseif current == nil then
      if el.t ~= 'Str' or not el.text:match '^•' then
        return nil
      end
      current = pandoc.Inlines{}
      table.insert(items, current)
      local rest = el.text:gsub('^•%s*', '')
      if rest ~= '' then
        current:insert(pandoc.Str(rest))
      end
    elseif not (el.t == 'Space' and #current == 0) then
      current:insert(el)
    end
  end
  return #items > 0 and items or nil
end

-- `strut` pads the bottom of the cell and must sit on its last line
local function cell_latex (cell, wraps, strut)
  local items = bullet_items(cell.contents)
  if items and wraps then
    local out = { '\\begin{tablelist}' }
    for _, inlines in ipairs(items) do
      table.insert(out, '\\item ' .. latex{ pandoc.Plain(inlines) })
    end
    out[#out] = out[#out] .. strut
    table.insert(out, '\\end{tablelist}')
    return table.concat(out, '\n')
  end
  local body = latex(cell.contents)
  -- \\ would end the row in an l/c/r column, so stack the lines instead
  if not wraps and body:find '\\\\' then
    body = '\\begin{tabular}[t]{@{}l@{}}' .. body .. '\\end{tabular}'
  end
  return body .. strut
end

local function row_latex (row, wraps, prefix)
  local cells = {}
  for _, cell in ipairs(row.cells) do
    table.insert(cells, prefix .. cell_latex(cell, wraps, '\\tablestrut'))
  end
  return table.concat(cells, ' & ') .. ' \\\\'
end

-- Rough height of a table in lines of table text, used to decide whether it
-- can be kept on one page
local MAX_UNBROKEN_LINES = 30
local CHARS_PER_LINE = 90 -- full-width line of \small Palatino

local function estimated_lines (tbl, rows)
  local total = #tbl.head.rows
  for _, row in ipairs(rows) do
    local tallest = 1
    for i, cell in ipairs(row.cells) do
      local width = tbl.colspecs[i][2]
      local per_line = CHARS_PER_LINE * (type(width) == 'number' and width or 1)
      -- Character counts of each <br>-separated line in the cell
      local lens = { 0 }
      cell.contents:walk {
        LineBreak = function () table.insert(lens, 0) end,
        Str = function (s) lens[#lens] = lens[#lens] + utf8.len(s.text) end,
        Space = function () lens[#lens] = lens[#lens] + 1 end,
      }
      local count = 0
      for _, len in ipairs(lens) do
        count = count + math.max(1, math.ceil(len / per_line))
      end
      tallest = math.max(tallest, count)
    end
    total = total + tallest + 0.5 -- cell padding
  end
  return total
end

function Table (tbl)
  if not FORMAT:match 'latex' then
    return nil
  end

  -- Leave anything with spanning cells to pandoc's own writer
  local rows = pandoc.List()
  for _, body in ipairs(tbl.bodies) do
    rows:extend(body.head)
    rows:extend(body.body)
  end
  local all = pandoc.List(tbl.head.rows) .. rows .. pandoc.List(tbl.foot.rows)
  for _, row in ipairs(all) do
    for _, cell in ipairs(row.cells) do
      if cell.row_span > 1 or cell.col_span > 1 then
        return nil
      end
    end
  end

  local n = #tbl.colspecs
  local wraps = type(tbl.colspecs[1][2]) == 'number'
  local cols = {}
  for _, spec in ipairs(tbl.colspecs) do
    local align = ALIGN[spec[1]] or ALIGN.AlignDefault
    if wraps then
      table.insert(cols, string.format(
        '>{%s\\arraybackslash}p{(\\linewidth - %d\\tabcolsep) * \\real{%.4f}}',
        align[1], 2 * n, spec[2]))
    else
      table.insert(cols, align[2])
    end
  end

  local label = ''
  if tbl.attr.identifier ~= '' then
    label = '\\label{' .. tbl.attr.identifier .. '}'
  end
  local caption, ltcaption = '', ''
  if #tbl.caption.long > 0 then
    local text = latex{
      pandoc.Plain(pandoc.utils.blocks_to_inlines(tbl.caption.long))
    }
    caption = '\\caption{' .. text .. '}' .. label
    ltcaption = caption .. '\\\\\n'
  end

  local head = {}
  for _, row in ipairs(tbl.head.rows) do
    table.insert(head, '\\rowcolor{brand}' .. row_latex(row, wraps, '\\tablehead '))
  end
  head = table.concat(head, '\n')

  local body = rows .. pandoc.List(tbl.foot.rows)
  local lines = {}
  for i, row in ipairs(body) do
    local stripe = i % 2 == 0 and '\\rowcolor{tablerow}' or ''
    table.insert(lines, stripe .. row_latex(row, wraps, '\\tablebody '))
  end
  lines = table.concat(lines, '\n')
  local spec = table.concat(cols, '\n  ')
  local rule = '\\specialrule{1pt}{0pt}{0pt}'

  -- A table that fits on a page is set as an unbreakable [H] float, which
  -- (like figures) stays on the same page as the heading above it
  if estimated_lines(tbl, body) <= MAX_UNBROKEN_LINES then
    return pandoc.RawBlock('latex', table.concat({
      '\\begin{table}[H]',
      '\\styledtable' .. (wraps and ''
      or '\\centering\\captionsetup{justification=centering}'),
      caption,
      '\\begin{tabular}{' .. spec .. '}',
      head,
      lines,
      rule,
      '\\end{tabular}',
      '\\end{table}',
    }, '\n'))
  end

  -- Longer tables break across pages with the header repeated on each
  return pandoc.RawBlock('latex', table.concat({
    '\\begin{longtablewrap}',
    '\\begin{longtable}{' .. spec .. '}',
    ltcaption .. head,
    '\\endfirsthead',
    head,
    '\\endhead',
    rule,
    '\\endlastfoot',
    lines,
    '\\end{longtable}',
    '\\end{longtablewrap}',
  }, '\n'))
end
