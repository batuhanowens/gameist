export default async (req) => {
  return new Response(
    JSON.stringify({ message: "Backend çalışıyor 🚀" }),
    { headers: { "Content-Type": "application/json" } }
  )
}
