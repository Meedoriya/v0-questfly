import { apiRequest } from "./client"

export interface CompleteTaskData {
  message: string
  xp_awarded?: number
}

export async function completeTask(taskId: string): Promise<CompleteTaskData> {
  return apiRequest<CompleteTaskData>(`/api/v1/tasks/${taskId}/complete`, {
    method: "POST",
  })
}

export async function uncompleteTask(taskId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/tasks/${taskId}/uncomplete`, {
    method: "POST",
  })
}
