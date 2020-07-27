import SlippiGame, { characters } from "slp-parser-js";
import * as fs from "fs";
import { ActionState, ActionDescription } from "./action";

import {
  PlayerType,
  PreFrameUpdateType,
  PostFrameUpdateType,
} from "slp-parser-js/dist/utils/slpReader";

type TableRow = {
  frame: number;
  time: string;
  clock: string;
  actionStateId: number;
  actionStateName: string;
  actionStateDesc: string;
  percent: number;
  frameCounter: number;
  stocks: number;
};

const TIMER_MINUTES = 8;

class PlayerData {
  index: number;
  port: number;
  character: characters.CharacterInfo;

  tableInfo: TableRow[];

  constructor(player: PlayerType) {
    this.index = player.playerIndex;
    this.port = player.port;
    this.character = characters.getCharacterInfo(player.characterId);
    this.tableInfo = [];
  }

  private getTime(frames: number): string {
    const duration = Math.floor((frames / 60) * 1000),
      centseconds = Math.floor((duration % 1000) / 10),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor(duration / (1000 * 60));
    return `${minutes < 10 ? "0" + minutes : minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }:${centseconds < 10 ? "0" + centseconds : centseconds}`;
  }

  private getRelativeTime(frames: number): string {
    const clock = TIMER_MINUTES * 60 * 1000;
    const duration = Math.floor(clock - (frames / 60) * 1000),
      centseconds = Math.floor((duration % 1000) / 10),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor(duration / (1000 * 60));
    return `${minutes < 10 ? "0" + minutes : minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }:${centseconds < 10 ? "0" + centseconds : centseconds}`;
  }

  public addRow(pre: PreFrameUpdateType, post: PostFrameUpdateType): void {
    this.tableInfo.push({
      frame: post.frame,
      time: this.getTime(post.frame),
      clock: this.getRelativeTime(post.frame),
      actionStateId: post.actionStateId,
      actionStateName: ActionState[post.actionStateId],
      percent: post.percent,
      stocks: post.stocksRemaining,
      frameCounter: post.actionStateCounter,
      actionStateDesc: ActionDescription.hasOwnProperty(
        ActionState[post.actionStateId]
      )
        ? ActionDescription[ActionState[post.actionStateId]]
        : "",
    });
  }
}

(function () {
  const game = new SlippiGame("test.slp");

  const players: PlayerData[] = game
    .getSettings()
    .players.map((p) => new PlayerData(p));

  const frameArr = game.getFrames();

  for (let i = 0; i < game.getLatestFrame().frame; i++) {
    const frame = frameArr[i];

    for (const playerFrame in frame.players) {
      if (frame.players.hasOwnProperty(playerFrame)) {
        const row = frame.players[playerFrame];
        const player = players.filter(
          (p) => p.index === row.pre.playerIndex
        )[0];

        player.addRow(row.pre, row.post);
      }
    }
  }

  fs.writeFileSync("result.json", JSON.stringify(players[0], null, 4));
})();
// console.log(characters.getCharacterInfo(19));
