export class Player {
  public betRequest(gameState: any, betCallback: (bet: number) => void): void {
    betCallback(gameState.minimum_raise);
  }

  public showdown(gameState: any): void {

  }
};

export default Player;
