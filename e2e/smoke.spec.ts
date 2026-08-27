import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 난이도 선택 화면이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("불구덩이 사자성어 타자");
  await expect(
    page.getByRole("heading", { level: 1, name: "불구덩이 사자성어 타자" })
  ).toBeVisible();
  await expect(page.getByText("얼마나 뜨겁게 타 볼까?")).toBeVisible();
  await expect(page.getByLabel("낱말 입력")).toBeVisible();
});
