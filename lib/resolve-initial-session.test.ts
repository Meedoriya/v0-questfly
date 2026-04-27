import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/api/campaigns", () => ({
  listCampaigns: vi.fn(),
}))

vi.mock("@/lib/hydrate-campaign", () => ({
  hydrateCampaignState: vi.fn(),
}))

import { listCampaigns } from "@/lib/api/campaigns"
import { hydrateCampaignState } from "@/lib/hydrate-campaign"
import { resolveInitialSessionFromCampaigns } from "@/lib/resolve-initial-session"

const mockQuest = {
  id: "q1",
  title: "Q",
  mode: "Casual" as const,
  progress: 0,
  totalTasks: 1,
  streak: 0,
  tasks: [],
}

describe("resolveInitialSessionFromCampaigns", () => {
  beforeEach(() => {
    vi.mocked(listCampaigns).mockReset()
    vi.mocked(hydrateCampaignState).mockReset()
  })

  it("пустой список → null", async () => {
    vi.mocked(listCampaigns).mockResolvedValue({ campaigns: [] })
    await expect(resolveInitialSessionFromCampaigns("")).resolves.toBeNull()
    expect(hydrateCampaignState).not.toHaveBeenCalled()
  })

  it("draft → ai-chat и цель из сводки", async () => {
    vi.mocked(listCampaigns).mockResolvedValue({
      campaigns: [
        {
          campaign_id: "c-draft",
          goal_text: "Learn piano",
          status: "draft",
          current_quest: 0,
          total_quests: 0,
          overall_progress: 0,
        },
      ],
    })
    const r = await resolveInitialSessionFromCampaigns("fallback")
    expect(r).toEqual({
      screen: "ai-chat",
      onboardingCampaignId: "c-draft",
      goal: "Learn piano",
    })
    expect(hydrateCampaignState).not.toHaveBeenCalled()
  })

  it("приоритет active над completed", async () => {
    vi.mocked(hydrateCampaignState).mockResolvedValue({
      quests: [mockQuest],
      currentQuest: mockQuest,
      currentTask: null,
    })
    vi.mocked(listCampaigns).mockResolvedValue({
      campaigns: [
        {
          campaign_id: "c-done",
          goal_text: "Old",
          status: "completed",
          current_quest: 1,
          total_quests: 1,
          overall_progress: 1,
        },
        {
          campaign_id: "c-act",
          goal_text: "Run",
          status: "active",
          current_quest: 1,
          total_quests: 3,
          overall_progress: 0.2,
        },
      ],
    })
    const r = await resolveInitialSessionFromCampaigns("")
    expect(r?.screen).toBe("home")
    expect(r?.activeCampaignId).toBe("c-act")
    expect(hydrateCampaignState).toHaveBeenCalledWith("c-act")
  })

  it("только completed → гидрация первой completed", async () => {
    vi.mocked(hydrateCampaignState).mockResolvedValue({
      quests: [mockQuest],
      currentQuest: mockQuest,
      currentTask: null,
    })
    vi.mocked(listCampaigns).mockResolvedValue({
      campaigns: [
        {
          campaign_id: "c-arch",
          goal_text: "X",
          status: "archived",
          current_quest: 0,
          total_quests: 1,
          overall_progress: 0,
        },
        {
          campaign_id: "c-fin",
          goal_text: "Y",
          status: "completed",
          current_quest: 2,
          total_quests: 2,
          overall_progress: 1,
        },
      ],
    })
    const r = await resolveInitialSessionFromCampaigns("")
    expect(r?.activeCampaignId).toBe("c-fin")
    expect(hydrateCampaignState).toHaveBeenCalledWith("c-fin")
  })
})
