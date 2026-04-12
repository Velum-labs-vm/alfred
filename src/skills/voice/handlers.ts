export type SkillResult = {ok: boolean; message: string; data?: unknown};

export async function handleSkillCommand(input: string): Promise<SkillResult> {
  return {ok: true, message: `Handled locally: ${input}`};
}
