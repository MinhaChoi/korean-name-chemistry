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

test("목숨을 모두 잃으면 패배 화면이 뜨고, 다시 불붙이기로 난이도 선택으로 돌아간다", async ({
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

test("제한 시간을 버티면 승리 화면이 뜬다", async ({ page }) => {
  // 제한 시간을 실제로 기다리는 대신 Date.now를 앞당겨, 카운트다운이 경과 시간을
  // 실측하는 성질을 이용해 남은 시간을 빠르게 소진시킨다.
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    let offset = 0;
    Object.defineProperty(window, "__advanceClock", {
      value: (ms: number) => {
        offset += ms;
      },
    });
    Date.now = () => realNow() + offset;
  });

  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  await expect(page.getByTestId("time-bar")).toBeVisible();

  await page.evaluate(() => {
    (window as unknown as { __advanceClock: (ms: number) => void }
    ).__advanceClock(61_000);
  });

  await expect(page.getByText("불구덩이에서 살아남았다")).toBeVisible();
  await expect(page.getByText(/\d+초를 끝까지 버텨냈다\./)).toBeVisible();
});

test("남은 시간이 화면에 표시된다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "모닥불" }).click();

  await expect(page.getByLabel(/남은 시간 \d+초/)).toBeVisible();
});
