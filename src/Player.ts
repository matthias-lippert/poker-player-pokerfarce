import {IGameState, IPlayer, ICard} from "./models/GameState";
export class Player {
    private ourPlayer: IPlayer;
    private handValues: number;
    private betCallback: any;
    private gameState:IGameState;

    public betRequest(gameState: IGameState, betCallback: (bet: number) => void): void {

        this.betCallback = betCallback;
        this.gameState = gameState;

        this.ourPlayer = this.getOurPlayer(gameState.players);
        this.handValues = this.calculateHandValue();

        if (this.handValues <= 10) {
            this.fold();
        } else if (this.handValues >= 25) {
            this.raise(gameState.minimum_raise);
        } else {
            this.check();
        }
    }

    public showdown(gameState: IGameState): void {

    }

    public raise(amount: number) {
        this.betCallback(amount);
    }

    public check() {
        this.betCallback(this.gameState.minimum_raise)
    }

    public fold() {
        this.betCallback(0)
    }

    private getOurPlayer(players: Array<IPlayer>): IPlayer {
        return players.filter((player: IPlayer) =>
            player.hole_cards
        )
    }

    private calculateHandValue() {
        let handValue = 0;
        for (let card of this.ourPlayer.hole_cards) {
            switch (card) {
                case "J":
                    handValue += 10;
                    break;
                case "Q":
                    handValue += 11;
                    break;
                case "K":
                    handValue += 12;
                    break;
                case "A":
                    handValue += 15;
                    break;
                default:
                    handValue += parseInt(<any>card.rank) - 1;
            }
        }
        return handValue;
    }
}
;

export default Player;
