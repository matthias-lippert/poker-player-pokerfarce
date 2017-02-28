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
        let allCardValue: number;
        // value += 90 * hand.flush;
        // value += 80 * hand.forOfAKind;
        // value += 50 * hand.straight;
        // value += 40 * hand.tripple;
        // value += 30 * hand.twoPair;
        // value += 20 * hand.pair;
        if (this.gameState.community_cards && this.gameState.community_cards.length > 0) {
            allCardValue = this.calculateHandAndCommunityValue();

            if (allCardValue < 10) {
                this.fold();
            } else if (allCardValue < 30) {
                this.check();
            } else if (allCardValue >= 90 ) {
                this.raise(this.ourPlayer.stack);
            } else {
                this.raise(this.gameState.current_buy_in - this.ourPlayer.bet + this.gameState.minimum_raise);
            }
        } else {
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
            flush: this.isFlush(this.gameState.community_cards, this.ourPlayer.hole_cards),
            straight: this.isStraight(this.gameState.community_cards, this.ourPlayer.hole_cards),
            pair: this.isPair(this.gameState.community_cards, this.ourPlayer.hole_cards),
            twoPair: this.isTwoPair(this.gameState.community_cards, this.ourPlayer.hole_cards),
            tripple: this.isTripple(this.gameState.community_cards, this.ourPlayer.hole_cards),
            forOfAKind: this.isForOfAKind(this.gameState.community_cards, this.ourPlayer.hole_cards),
        };

        value += 90 * hand.flush;
        value += 80 * hand.forOfAKind;
        value += 50 * hand.straight;
        value += 40 * hand.tripple;
        value += 30 * hand.twoPair;
        value += 20 * hand.pair;

        return value;
    }

    private isFlush(community_cards: Array<ICard>, hole_cards: Array<ICard>): number {
        let cardColors = {
            clubs: 0, spades: 0, hearts: 0, diamonds: 0
        };

        for (let card of community_cards) {
            cardColors[card.suit] = cardColors[card.suit] + 1;
        }
        for (let card of hole_cards) {
            cardColors[card.suit] = cardColors[card.suit] + 1;
        }

        for (let cardColor in cardColors) {
            if (cardColors[cardColor] === 5) {
                return 1;
            }
        }

        var cardsLeft = 5 - community_cards.length;

        // 0%
        if (cardColors.clubs + cardsLeft < 5 &&
            cardColors.spades + cardsLeft < 5 &&
            cardColors.hearts + cardsLeft < 5 &&
            cardColors.diamonds + cardsLeft < 5
        ) {
            return 0;
        }

        // TODO besser machen
        return 0.5;
    }

    private isStraight(community_cards: Array<ICard>, hole_cards: Array<ICard>): number {
        var cardsLeft = 5 - community_cards.length;

        var cardValues: number[] = [];
        for (let i = 0; i < 14; i++) {
            cardValues[i] = 0;
        }

        for (let card of community_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }
        for (let card of hole_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }

        // 100%
        var row = 0;
        for (let i = 0; i < cardValues.length; i++) {
            if (cardValues[i] > 0) {
                row++;
                if (row >= 5) {
                    return 1;
                }
            } else {
                row = 0;
            }
        }

        // 0%
        var row = 0;
        var gap = 0;
        for (let i = 0; i < cardValues.length; i++) {
            if (cardValues[i] > 0) {
                row++;
                gap = 0;
                if (row + cardsLeft >= 5) {
                    return 0.5;
                }
            } else {
                gap++;
                if (gap > cardsLeft) {
                    row = 0;
                }
            }
        }

        return 0;
    }

    private isPair(community_cards: Array<ICard>, hole_cards: Array<ICard>): number {
        var cardsLeft = 5 - community_cards.length;

        var cardValues: number[] = [];
        for (let i = 0; i < 14; i++) {
            cardValues[i] = 0;
        }

        for (let card of community_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }
        for (let card of hole_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }

        // 100%
        for (let cardValue of cardValues) {
            if (cardValue >= 2) {
                return 1;
            }
        }

        return cardsLeft > 0 ? 0.5 : 0;
    }

    private isTwoPair(community_cards: Array<ICard>, hole_cards: Array<ICard>): number {
        var cardsLeft = 5 - community_cards.length;
        let pairs = 0;

        var cardValues: number[] = [];
        for (let i = 0; i < 14; i++) {
            cardValues[i] = 0;
        }

        for (let card of community_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }
        for (let card of hole_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }

        // 100%
        for (let cardValue of cardValues) {
            if (cardValue >= 2) {
                pairs++;
                if (pairs > 1) {
                    return 1;
                }
            }
        }
        if (cardsLeft == 2 && pairs == 1) {
            return 0.5;
        }
        return cardsLeft == 1 && pairs == 1 ? 0.25 : 0;
    }

    private isTripple(community_cards: Array<ICard>, hole_cards: Array<ICard>) {
        var cardsLeft = 5 - community_cards.length;
        let hasPair = false;

        var cardValues: number[] = [];
        for (let i = 0; i < 14; i++) {
            cardValues[i] = 0;
        }

        for (let card of community_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }
        for (let card of hole_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }

        // 100%
        for (let cardValue of cardValues) {
            if (cardValue >= 3) {
                return 1;
            }
            if (cardValue == 2) {
                hasPair = true;
            }
        }

        return cardsLeft > 0 && hasPair ? 0.5 : 0;
    }

    private isForOfAKind(community_cards: Array<ICard>, hole_cards: Array<ICard>): number {
        var cardsLeft = 5 - community_cards.length;
        let hasTripple = false;

        var cardValues: number[] = [];
        for (let i = 0; i < 14; i++) {
            cardValues[i] = 0;
        }

        for (let card of community_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }
        for (let card of hole_cards) {
            let valueForCard = this.getValueForCard(card);

            cardValues[valueForCard]++;
        }

        // 100%
        for (let cardValue of cardValues) {
            if (cardValue == 4) {
                return 1;
            }
            if (cardValue == 3) {
                hasTripple = true;
            }
        }

        return cardsLeft > 0 && hasTripple ? 0.25 : 0;
    }
}

export default Player;
