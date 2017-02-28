import {IGameState, IPlayer, ICard} from "./models/GameState";
export class Player {
    private ourPlayer: IPlayer;
    private handValues: number;
    private betCallback: Function;
    private gameState: IGameState;

    public betRequest(gameState: IGameState, betCallback: (bet: number) => void): void {

        this.betCallback = betCallback;
        this.gameState = gameState;

        this.ourPlayer = this.getOurPlayer();
        this.handValues = this.calculateHandValue();

        let reduceValue = Math.min(0, Math.floor(this.gameState.current_buy_in / this.ourPlayer.stack * 5));
        this.handValues -= reduceValue;

        this.play();
    }

    play() {
        let cardValue = this.handValues;
        // if (this.gameState.community_cards && this.gameState.community_cards.length > 0) {
        // value = this.calculateHandAndCommunityValue();
        // }

        if (cardValue <= 10) {
            this.fold();
        } else if (cardValue >= 40) {
            this.raise(Math.min(200, this.ourPlayer.stack));
        } else if (cardValue >= 25) {
            this.raise(this.gameState.current_buy_in - this.ourPlayer.bet + this.gameState.minimum_raise);
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
        this.betCallback(this.gameState.current_buy_in - this.ourPlayer.bet);
    }

    public fold() {
        this.betCallback(0);
    }

    private getOurPlayer(): IPlayer {
        return this.gameState.players[this.gameState.in_action];
    }

    private getValueByColor(cards: Array<ICard>): number {
        let value: number = 0;
        if (cards[0].suit === cards[1].suit) {
            value = 10;
        }
        return value;
    }

    private getValueByPair(cards: Array<ICard>): number {
        let value: number = 0;
        if (cards[0].rank === cards[1].rank) {
            value = 15;
        }
        return value;
    }

    private getValueForCard(card: ICard): number {
        let value: number;
        switch (card) {
            case "J":
                value = 10;
                break;
            case "Q":
                value = 11;
                break;
            case "K":
                value = 12;
                break;
            case "A":
                value = 13;
                break;
            default:
                value = parseInt(<any>card.rank) - 1;
        }
        return value;
    }

    private getValueForFollow(cards: Array<ICard>): number {
        let valueOfCardOne = this.getValueForCard(cards[0].rank);
        let valueOfCardTwo = this.getValueForCard(cards[1].rank);

        let value: number = 0;
        let diff = Math.abs(valueOfCardOne - valueOfCardTwo);
        if (diff == 1) {
            value = 5;
        } else if (diff == 2) {
            value = 3
        }
        return value;
    }

    private calculateHandValue() {
        let handValue = 0;
        // clubs,spades,hearts,diamonds
        for (let card of this.ourPlayer.hole_cards) {
            let currValue: number = this.getValueForCard(card);
            // wenn Ass
            if (currValue === 13) currValue += 2;

            handValue += currValue
        }

        handValue += this.getValueByColor(this.ourPlayer.hole_cards);
        handValue += this.getValueByPair(this.ourPlayer.hole_cards);
        handValue += this.getValueForFollow(this.ourPlayer.hole_cards);

        return handValue;
    }

    private calculateHandAndCommunityValue(): number {
        let value: number = 0;
        let hand = {
            isFlush: this.isFlush(this.gameState.community_cards, this.ourPlayer.hole_cards),
            isStraight: this.isStraight(this.gameState.community_cards)
        };
        return 0;
    }

    private isFlush(community_cards: Array<ICard>, hole_cards: Array<ICard>): boolean {
        let cardColors = {
            clubs: 0, spades: 0, hearts: 0, diamonds: 0
        };
        let returnValue: boolean = false;

        for (let card of community_cards) {
            cardColors[card.suit] = cardColors[card.suit] + 1;
        }
        for (let card of hole_cards) {
            cardColors[card.suit] = cardColors[card.suit] + 1;
        }

        for (let cardColor in cardColors) {
            if (cardColors[cardColor] === 5 || cardColors[cardColor] + (5 - community_cards.length) === 5) {
                returnValue = true;
                break;
            }
        }
        return returnValue;
    }

    private isStraight(community_cards: Array<ICard>): boolean {
        return false;
    }
}

export default Player;
