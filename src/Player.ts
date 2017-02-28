import {IGameState, IPlayer, ICard} from "./models/GameState";
export class Player {
    private ourPlayer: IPlayer;
    private handValues: number;
    private betCallback: Function;
    private gameState:IGameState;

    public betRequest(gameState: IGameState, betCallback: (bet: number) => void): void {

        this.betCallback = betCallback;
        this.gameState = gameState;

        this.ourPlayer = this.getOurPlayer();
        this.handValues = this.calculateHandValue();

        this.play();
    }

    play() {
        if (this.handValues <= 10) {
            this.fold();
        } else if (this.handValues >= 25) {
            this.raise(this.gameState.minimum_raise);
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
        this.betCallback(this.gameState.minimum_raise);
    }

    public fold() {
        this.betCallback(0);
    }

    private getOurPlayer(): IPlayer {
        return this.gameState.players[this.gameState.in_action];
        // return players.filter((player: IPlayer) => {
        //     if (player.hole_cards && player.hole_cards.length > 0) {
        //         return true;
        //     } else {
        //         return false;
        //     }
        // })
    }

    private getValueByColor(cards: Array<ICard>): number {
        let value: number = 0;
        let handColor = "";
        for (let card of cards) {
            if (handColor === "")  {
                handColor = card.suit;
            } else {
                if (handColor === card.suit) {
                    value += 10;
                }
            }
        }
        return value;
    }

    private calculateHandValue() {
        let handValue = 0;
        // clubs,spades,hearts,diamonds
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

        handValue += this.getValueByColor(this.ourPlayer.hole_cards);

        return handValue;
    }
}
;

export default Player;
