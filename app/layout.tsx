import { PALETTE } from "../lib/theme";
export const metadata = { title: "Rico's Campus · v1 prototype", description: "3D campus prototype: Travel Room, NFL Game Hub, NBA Game Hub, Money Room, ApexTitan Shop. Placeholder content only." };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const, themeColor: PALETTE.page };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body style={{ margin: 0, background: PALETTE.page, color: PALETTE.text, colorScheme: "dark", WebkitTextSizeAdjust: "100%" }}>{children}</body>
    </html>
  );
}
