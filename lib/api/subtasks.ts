import { apiRequest } from "./client"

export interface CompleteSubtaskData {
  message: string
  xp_awarded?: number
}

export async function completeSubtask(subtaskId: string): Promise<CompleteSubtaskData> {
  return apiRequest<CompleteSubtaskData>(`/api/v1/subtasks/${subtaskId}/complete`, {
    method: "POST",
  })
}

export async function uncompleteSubtask(subtaskId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/subtasks/${subtaskId}/uncomplete`, {
    method: "POST",
  })
}
