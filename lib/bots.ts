// Real Grok Bot agent ids for Rico's campus. Chat buttons use this deep link only.
export const chatHref = (id: string) => `grokbot://app/v1/agent?id=${id}`

export type CampusBot = {
  id: string
  name: string
  role: string
  /** Room this bot owns. Null means it is listed in Ghost HQ only. */
  roomId: string | null
  roomName: string | null
}

export const bots: CampusBot[] = [
  { id: "51301de6-7619-41a1-b501-5addb96a78bf", name: "Ghost6", role: "Chief of Staff", roomId: "hq", roomName: "Ghost HQ" },
  { id: "43552431-a941-43c8-9a62-ede19f2c0ac7", name: "Travel Agent", role: "", roomId: "travel", roomName: "Travel Room" },
  { id: "0bcd66da-bca8-4d8c-80f0-a827a79ab95b", name: "Blitz", role: "NFL Research", roomId: "nfl", roomName: "NFL Game Hub" },
  { id: "ff79913d-8e37-4af9-b035-11a26727df67", name: "BetGuru", role: "Sports Bet Savant", roomId: "nba", roomName: "NBA Game Hub" },
  { id: "331338ee-4a28-47ec-803b-561dba4679d5", name: "Money Maker Bot", role: "", roomId: "money", roomName: "Money Room" },
  { id: "41135edf-1c9d-4bd6-87b3-924956475572", name: "ApexTitan", role: "Online Store Manager", roomId: "shop", roomName: "ApexTitan Shop" },
  { id: "c4649df2-e5b8-4405-9552-c81153ff82d9", name: "Einstein", role: "App & Web Design Developer", roomId: null, roomName: null },
  { id: "04086def-1d67-479c-827c-29a3a7ce9eaf", name: "College DropOut", role: "", roomId: null, roomName: null },
  { id: "8e272c25-8d4c-4c0d-80f9-edd8c541605e", name: "TopShotta", role: "Baseball Research", roomId: null, roomName: null },
]

export const botsByRoomId: Record<string, CampusBot> = Object.fromEntries(
  bots.filter((b) => b.roomId).map((b) => [b.roomId as string, b]),
)

export const botsByName: Record<string, CampusBot> = Object.fromEntries(bots.map((b) => [b.name, b]))
