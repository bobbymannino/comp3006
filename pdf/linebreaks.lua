-- Turn raw HTML <br> (the only way to break a line inside a pipe-table cell
-- that also renders on GitHub) into a real line break for LaTeX.
function RawInline (el)
  if el.format == 'html' and el.text:match '^<br%s*/?>$' then
    return pandoc.LineBreak()
  end
end
