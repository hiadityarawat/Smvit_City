import { describe,expect,it } from "vitest";
import { followsService } from "./follows.service.js";
import { friendsService } from "./friends.service.js";
describe("social graph rules",()=>{
  it("rejects following yourself without touching the database",async()=>{await expect(followsService.follow("same-user","same-user")).rejects.toMatchObject({code:"SELF_FOLLOW_FORBIDDEN"});});
  it("rejects sending yourself a friend request",async()=>{await expect(friendsService.request("same-user","same-user")).rejects.toMatchObject({code:"SELF_FRIEND_FORBIDDEN"});});
});
