import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RowMenu } from "../RowMenu";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("RowMenu (Three-Dot Campaign Menu - Exactly 3 Actions)", () => {
  const baseCampaign = {
    id: "cmp-101",
    name: "SP - Flagship Exact",
    status: "ENABLED",
    daily_budget: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens and closes the menu when clicking trigger without bubbling to parent row", () => {
    const onRowClick = vi.fn();
    render(
      <table>
        <tbody>
          <tr onClick={onRowClick}>
            <td>
              <RowMenu campaign={baseCampaign} />
            </td>
          </tr>
        </tbody>
      </table>
    );

    const trigger = screen.getByTestId("row-menu-trigger-cmp-101");
    fireEvent.click(trigger);

    // Exactly the 3 required options
    expect(screen.getByText("Bid Threshold")).toBeDefined();
    expect(screen.getByText("View Campaign")).toBeDefined();
    expect(screen.getByText("Hourly Tracking")).toBeDefined();
    expect(onRowClick).not.toHaveBeenCalled();

    // Closing menu
    fireEvent.click(trigger);
    expect(screen.queryByText("Bid Threshold")).toBeNull();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("navigates to /campaigns/[id] when View Campaign is clicked", () => {
    render(<RowMenu campaign={baseCampaign} />);

    fireEvent.click(screen.getByTestId("row-menu-trigger-cmp-101"));
    fireEvent.click(screen.getByText("View Campaign"));

    expect(pushMock).toHaveBeenCalledWith("/campaigns/cmp-101");
  });

  it("triggers callbacks for Bid Threshold and Hourly Tracking", () => {
    const onBidThreshold = vi.fn();
    const onHourlyTracking = vi.fn();

    render(
      <RowMenu
        campaign={baseCampaign}
        onBidThreshold={onBidThreshold}
        onHourlyTracking={onHourlyTracking}
      />
    );

    fireEvent.click(screen.getByTestId("row-menu-trigger-cmp-101"));
    fireEvent.click(screen.getByText("Bid Threshold"));
    expect(onBidThreshold).toHaveBeenCalledWith(baseCampaign);

    fireEvent.click(screen.getByTestId("row-menu-trigger-cmp-101"));
    fireEvent.click(screen.getByText("Hourly Tracking"));
    expect(onHourlyTracking).toHaveBeenCalledWith(baseCampaign);
  });
});
