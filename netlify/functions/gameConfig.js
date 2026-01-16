export default async () => {
  return new Response(
    JSON.stringify({
      enemyHpBase: 100,
      enemyHpScale: 1.12,
      damageScale: 1.08,
      dropRate: 0.07
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
}
