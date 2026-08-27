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

test("맞힌 사자성어의 뜻이 입력창 아래에 표시된다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  const meaningBox = page.getByTestId("last-cleared-meaning");
  await expect(meaningBox).toBeEmpty();

  const firstWord = page.getByTestId("falling-word").first();
  const text = await firstWord.textContent();
  expect(text).toBeTruthy();

  await page.getByLabel("낱말 입력").pressSequentially(text!);

  await expect(meaningBox).toContainText(text!);
  // 사자성어 네 글자 뒤에 실제 뜻풀이가 함께 붙는다.
  expect((await meaningBox.textContent())!.length).toBeGreaterThan(
    text!.length
  );
});
