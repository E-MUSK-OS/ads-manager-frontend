import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RowMenu } from "../RowMenu";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>
          Confirm Action
        </button>
        <button type="button" onClick={onCancel}>
          Cancel Action
        </button>
      </div>
    ) : null,
}));

describe("RowMenu (Three-Dot Campaign Menu)", () => {
  const baseCampaign = {
    id: "cmp-101",
    name: "SP - Flagship Exact",
    status: "ENABLED",
    daily_budget: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens and closes the menu when clicking the three-dot trigger without bubbling to the parent row", () => {
    const onRowClick = vi.fn();
    render(
      <table>
        <tbody>
          <tr onClick={onRowClick}>
            <td>
              <RowMenu campaign={baseCampaign} onStatusChange={vi.fn()} />
            </td>
          </tr>
        </tbody>
      </table>
    );

    const trigger = screen.getByTestId("row-menu-trigger-cmp-101");
    fireEvent.click(trigger);

    expect(screen.getByText("View details")).toBeDefined();
    expect(screen.getByText("Pause campaign")).toBeDefined();
    expect(onRowClick).not.toHaveBeenCalled();

    // Clicking trigger again closes the menu cleanly
    fireEvent.click(trigger);
    expect(screen.queryByText("View details")).toBeNull();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("displays 'Enable campaign' when status is PAUSED and hides Archive when ARCHIVED", () => {
    const { rerender } = render(
      <RowMenu
        campaign={{ ...baseCampaign, status: "PAUSED" }}
        onStatusChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("row-menu-trigger-cmp-101"));
    expect(screen.getByText("Enable campaign")).toBeDefined();
    expect(screen.queryByText("Pause campaign")).toBeNull();

    // Rerender as ARCHIVED
    rerender(
      <RowMenu
        campaign={{ ...baseCampaign, status: "ARCHIVED" }}
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.queryByText("Archive campaign")).toBeNull();
  });

  it("keeps ConfirmDialog mounted after closing the popover when Archive is clicked", async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render(
      <RowMenu campaign={baseCampaign} onStatusChange={onStatusChange} />
    );

    fireEvent.click(screen.getByTestId("row-menu-trigger-cmp-101"));
    fireEvent.click(screen.getByText("Archive campaign"));

    // Menu closes, but ConfirmDialog remains mounted
    expect(screen.queryByText("View details")).toBeNull();
    expect(screen.getByTestId("confirm-dialog")).toBeDefined();

    fireEvent.click(screen.getByText("Confirm Action"));
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("cmp-101", "ARCHIVED");
    });
  });
});
