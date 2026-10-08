Add-Type -AssemblyName System.Drawing
$svgDirectory = $PSScriptRoot
$textSvgPath = Join-Path $svgDirectory 'ribbon-tab-text.svg'
$outlinedSvgPath = Join-Path $svgDirectory 'ribbon-tab.svg'
$svgDocument = New-Object System.Xml.XmlDocument
$svgDocument.PreserveWhitespace = $true
$svgDocument.Load($textSvgPath)
$svgNamespace = 'http://www.w3.org/2000/svg'
$fontFamily = New-Object System.Drawing.FontFamily('Malgun Gothic')
$format = [System.Drawing.StringFormat]::GenericTypographic.Clone()
$format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::NoWrap
$numberCulture = [System.Globalization.CultureInfo]::InvariantCulture
function Format-SvgNumber([double]$value) {
  return $value.ToString('0.###', $numberCulture)
}
$labels = @(
  @{ Id = 'push-label'; Text = '밀어서 넘기기'; Width = 380.0; Top = 312.0; Fill = '#20324D' },
  @{ Id = 'pull-label'; Text = '당겨서 지원'; Width = 344.0; Top = 846.0; Fill = '#FFFFFF' }
)
foreach ($label in $labels) {
  $glyphPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  try {
    $origin = New-Object System.Drawing.PointF(0, 0)
    $glyphPath.AddString($label.Text, $fontFamily, [int][System.Drawing.FontStyle]::Bold, [single]64, $origin, $format)
    $glyphBounds = $glyphPath.GetBounds()
    $scale = $label.Width / $glyphBounds.Width
    $offsetX = (600.0 - $label.Width) / 2.0
    $pathPoints = $glyphPath.PathPoints
    $pathTypes = $glyphPath.PathTypes
    $pathCommands = New-Object System.Collections.Generic.List[string]
    for ($index = 0; $index -lt $pathPoints.Length; $index++) {
      $pathType = $pathTypes[$index] -band 7
      $pointX = ($pathPoints[$index].X - $glyphBounds.X) * $scale + $offsetX
      $pointY = ($pathPoints[$index].Y - $glyphBounds.Y) * $scale + $label.Top
      $coordinates = (Format-SvgNumber $pointX) + ' ' + (Format-SvgNumber $pointY)
      if ($pathType -eq 0) {
        $pathCommands.Add('M' + $coordinates)
      } elseif ($pathType -eq 1) {
        $pathCommands.Add('L' + $coordinates)
      } elseif ($pathType -eq 3) {
        if ($index + 2 -ge $pathPoints.Length) { throw 'Incomplete Bezier segment.' }
        $coordinates2 = (Format-SvgNumber (($pathPoints[$index + 1].X - $glyphBounds.X) * $scale + $offsetX)) + ' ' + (Format-SvgNumber (($pathPoints[$index + 1].Y - $glyphBounds.Y) * $scale + $label.Top))
        $coordinates3 = (Format-SvgNumber (($pathPoints[$index + 2].X - $glyphBounds.X) * $scale + $offsetX)) + ' ' + (Format-SvgNumber (($pathPoints[$index + 2].Y - $glyphBounds.Y) * $scale + $label.Top))
        $pathCommands.Add('C' + $coordinates + ' ' + $coordinates2 + ' ' + $coordinates3)
        $index += 2
      } else { throw "Unsupported path type: $pathType" }
      if (($pathTypes[$index] -band 128) -ne 0) { $pathCommands.Add('Z') }
    }
    $oldText = $svgDocument.SelectSingleNode("//*[@id='$($label.Id)']")
    if ($null -eq $oldText) { throw "Missing text: $($label.Id)" }
    $groupNode = $svgDocument.CreateElement('g', $svgNamespace)
    $groupNode.SetAttribute('id', $label.Id)
    $groupNode.SetAttribute('aria-label', $label.Text)
    $pathNode = $svgDocument.CreateElement('path', $svgNamespace)
    $pathNode.SetAttribute('d', ($pathCommands -join ' '))
    $pathNode.SetAttribute('fill', $label.Fill)
    $pathNode.SetAttribute('fill-rule', 'evenodd')
    [void]$groupNode.AppendChild($pathNode)
    [void]$oldText.ParentNode.ReplaceChild($groupNode, $oldText)
    Write-Output "$($label.Id): $($pathPoints.Length) points; width $($label.Width); height $([Math]::Round($glyphBounds.Height * $scale, 2))"
  } finally { $glyphPath.Dispose() }
}
$svgDocument.Save($outlinedSvgPath)
$format.Dispose()
$fontFamily.Dispose()
if ($svgDocument.SelectNodes("//*[local-name()='text' or local-name()='image' or local-name()='filter']").Count -ne 0) { throw 'Outlined SVG has non-vector or unsupported nodes.' }
Write-Output "Saved: $outlinedSvgPath"
