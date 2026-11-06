// Renders image/og/ullim-og.png and image/icons/icon-*.png. Run: swiftc scripts/compose-share-art.swift -o <tmp>/compose && <tmp>/compose "$PWD", then convert the OG PNG to JPEG with sips.
import AppKit

// usage: compose <projectRoot>
let root = CommandLine.arguments[1]
func image(_ p: String) -> CGImage {
  guard let ns = NSImage(contentsOfFile: root + "/" + p) else { fatalError("missing \(p)") }
  var rect = CGRect(origin: .zero, size: ns.size)
  return ns.cgImage(forProposedRect: &rect, context: nil, hints: nil)!
}
func canvas(_ w: Int, _ h: Int) -> CGContext {
  CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}
func save(_ ctx: CGContext, _ p: String) {
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: root + "/" + p))
}
func fit(_ img: CGImage, width: CGFloat, centerX: CGFloat, centerY: CGFloat) -> CGRect {
  let h = width * CGFloat(img.height) / CGFloat(img.width)
  return CGRect(x: centerX - width / 2, y: centerY - h / 2, width: width, height: h)
}
let bg = image("image/backgrounds/chatgpt_generated_018_99f70fe2eb.jpg")
let logo = image("image/branding/title-logo.png")
let pio = image("image/generated/pio-guide.svg")

// Share preview 1200x630: key art cover-fit, soft centre glow, logo, Pio.
let og = canvas(1200, 630)
let scale = max(1200 / CGFloat(bg.width), 630 / CGFloat(bg.height))
let bw = CGFloat(bg.width) * scale, bh = CGFloat(bg.height) * scale
og.draw(bg, in: CGRect(x: (1200 - bw) / 2, y: (630 - bh) / 2, width: bw, height: bh))
let glow = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!, colors: [CGColor(red: 1, green: 1, blue: 1, alpha: 0.6), CGColor(red: 1, green: 1, blue: 1, alpha: 0)] as CFArray, locations: [0, 1])!
og.drawRadialGradient(glow, startCenter: CGPoint(x: 600, y: 330), startRadius: 0, endCenter: CGPoint(x: 600, y: 330), endRadius: 470, options: [])
og.draw(logo, in: fit(logo, width: 900, centerX: 600, centerY: 330))
og.draw(pio, in: fit(pio, width: 170, centerX: 1080, centerY: 115))
save(og, "image/og/ullim-og.png")

// App icons: Pio on the cyan brand tile.
for size in [192, 512] {
  let s = CGFloat(size), ctx = canvas(size, size)
  let tile = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!, colors: [CGColor(red: 1, green: 0.96, blue: 0.84, alpha: 1), CGColor(red: 0.74, green: 0.93, blue: 0.93, alpha: 1)] as CFArray, locations: [0, 1])!
  ctx.drawLinearGradient(tile, start: CGPoint(x: 0, y: s), end: CGPoint(x: s, y: 0), options: [])
  ctx.draw(pio, in: fit(pio, width: s * 0.74, centerX: s / 2, centerY: s * 0.48))
  save(ctx, "image/icons/icon-\(size).png")
}
print("done")
