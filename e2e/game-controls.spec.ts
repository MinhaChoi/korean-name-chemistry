import { expect, test } from "@playwright/test";

test("Enter를 누르면 입력창이 초기화된다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  const input = page.getByLabel("낱말 입력");
  await input.fill("아무거나");
  await expect(input).toHaveValue("아무거나");

  await input.press("Enter");
  await expect(input).toHaveValue("");
});

test("게임오버 후 다시 불붙이기를 누르면 난이도 선택 화면으로 돌아간다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  // 목숨 5개를 모두 소진시키기 위해 낙하 완료(animationend)를 5번 강제로 재현한다.
  for (let i = 0; i < 5; i++) {
    const word = page.getByTestId("falling-word").first();
    await expect(word).toBeVisible();
    await word.evaluate((el) => {
      el.dispatchEvent(
        new AnimationEvent("animationend", {
          animationName: "fall-down",
          bubbles: true,
        })
      );
    });
  }

  await expect(page.getByText("까맣게 타버렸다")).toBeVisible();

  await page.getByRole("button", { name: "다시 불붙이기" }).click();

  await expect(page.getByText("얼마나 뜨겁게 타 볼까?")).toBeVisible();
  await expect(page.getByTestId("falling-word")).toHaveCount(0);
});
