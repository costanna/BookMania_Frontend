/* eslint-disable no-undef */
import { sizedCoverUrl } from "../utils/bookCover";

describe("sizedCoverUrl", () => {
  const mz = "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/f9/5e/e2/abc/9788490192214.jpg";

  test("pide a mzstatic la medida indicada en WebP", () => {
    expect(sizedCoverUrl(`${mz}/600x600bb.jpg`, 400, 600)).toBe(`${mz}/400x600bb.webp`);
    expect(sizedCoverUrl(`${mz}/1200x1200bb.png`, 600, 900)).toBe(`${mz}/600x900bb.webp`);
  });

  test("deja intactas las URLs de otros servidores", () => {
    const other = "https://imagessl7.casadellibro.com/a/l/s5/17/9788445017517.webp";
    expect(sizedCoverUrl(other, 400, 600)).toBe(other);
  });

  test("devuelve lo mismo si no hay URL", () => {
    expect(sizedCoverUrl(null, 400, 600)).toBeNull();
    expect(sizedCoverUrl("", 400, 600)).toBe("");
  });
});
