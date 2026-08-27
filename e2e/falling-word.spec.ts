import { expect, test } from "@playwright/test";

test("낱말이 시간이 지나면서 아래로 떨어진다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  const firstWord = page.getByTestId("falling-word").first();
  await expect(firstWord).toBeVisible();

  const before = await firstWord.boundingBox();
  await page.waitForTimeout(2000);
  const after = await firstWord.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(after!.y).toBeGreaterThan(before!.y);
});

test("낱말을 정확히 입력하면 사라지고 점수가 오른다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  const firstWord = page.getByTestId("falling-word").first();
  const text = await firstWord.textContent();
  expect(text).toBeTruthy();

  await page.getByLabel("낱말 입력").pressSequentially(text!);

  await expect(page.getByText(`점수 100`)).toBeVisible();
});
