import { expect, open, test } from "nsh/test";

test("opens on the collection list", async () => {
  const app = await open("./App.tsx");
  expect(app.texts()).toContain("码控");
  expect(app.texts()).toContain("会控页面收藏夹");
});
