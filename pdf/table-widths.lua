-- Pandoc sizes wrapping pipe-table columns from the dash counts in the
-- separator row, so a short column (e.g. "Product") next to long ones gets
-- squashed until words overflow. Widen any column narrower than its longest
-- word, taking the space proportionally from the other columns.
local LINE_CHARS = 72 -- pandoc's default --columns, which widths are relative to

local function longest_word (cell, longest)
  for word in pandoc.utils.stringify(cell.contents):gmatch '%S+' do
    longest = math.max(longest, utf8.len(word) or #word)
  end
  return longest
end

function Table (tbl)
  local specs = tbl.colspecs
  local widths, mins = {}, {}
  for i, spec in ipairs(specs) do
    -- No explicit width means the table doesn't wrap; leave it alone
    if type(spec[2]) ~= 'number' then
      return nil
    end
    widths[i], mins[i] = spec[2], 0
  end

  local function scan (rows)
    for _, row in ipairs(rows) do
      for i, cell in ipairs(row.cells) do
        if mins[i] then
          mins[i] = math.max(mins[i], (longest_word(cell, 0) + 2) / LINE_CHARS)
        end
      end
    end
  end
  scan(tbl.head.rows)
  for _, body in ipairs(tbl.bodies) do
    scan(body.body)
  end

  local total, grow, spare = 0, 0, 0
  for i, w in ipairs(widths) do
    total = total + w
    if w < mins[i] then
      grow = grow + mins[i] - w
    else
      spare = spare + w
    end
  end
  if grow == 0 or spare <= grow then
    return nil
  end

  local shrink = (spare - grow) / spare
  for i, w in ipairs(widths) do
    specs[i][2] = w < mins[i] and mins[i] or w * shrink
  end
  tbl.colspecs = specs
  return tbl
end
