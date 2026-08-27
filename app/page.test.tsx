import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 타자 게임 제목과 난이도 선택, 입력창을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: /불구덩이 사자성어 타자/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/점수 0/)).toBeInTheDocument();
  expect(screen.getByText("얼마나 뜨겁게 타 볼까?")).toBeInTheDocument();
  expect(screen.getByLabelText("낱말 입력")).toBeInTheDocument();
});
