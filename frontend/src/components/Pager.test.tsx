import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("renders nothing when there's only one page", () => {
    const { container } = render(<Pager page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a numbered button per page and marks the current one", () => {
    render(<Pager page={2} totalPages={5} onPageChange={vi.fn()} />);
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByText(String(n))).toBeInTheDocument();
    }
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
  });

  it("calls onPageChange when a page number is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pager page={1} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByText("4"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("disables Previous on the first page and Next on the last page", () => {
    const { rerender } = render(<Pager page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).toBeEnabled();

    rerender(<Pager page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText("Previous")).toBeEnabled();
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("calls onPageChange with page +/- 1 when clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pager page={2} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
