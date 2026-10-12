-- Render GitHub-style alerts (> [!NOTE] etc., parsed via +alerts) as
-- coloured left-bar boxes using the `alert` environment in header.tex.
local types = {
  note = true, tip = true, important = true, warning = true, caution = true,
}

function Div (div)
  if not FORMAT:match 'latex' or not div.classes:includes 'alert' then
    return nil
  end

  local kind = div.classes:find_if(function (c) return types[c] end)
  if not kind then
    return nil
  end

  local title = kind:gsub('^%l', string.upper)
  local body = pandoc.List()
  for _, block in ipairs(div.content) do
    if block.t == 'Div' and block.classes:includes 'title' then
      title = pandoc.utils.stringify(block)
    else
      body:insert(block)
    end
  end

  return pandoc.List{
    pandoc.RawBlock('latex',
      string.format('\\begin{alert}{alert%s}{%s}', kind, title)),
  } .. body .. pandoc.List{
    pandoc.RawBlock('latex', '\\end{alert}'),
  }
end
