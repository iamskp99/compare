# compare
An image comparison app based on Elo-algorithm.
In this web app you can make your own comparison page.
This app compares rating of two users at a time from the database based on which user is selected and which is not.

The ratings are calculated by elo-algorithm.

Elo Rating Algorithm is widely used rating algorithm that is used to rank players in many competitive games.
Players with higher ELO rating have a higher probability of winning a game than a player with lower ELO rating. After each game, ELO rating of players is updated. If a player with higher ELO rating wins, only a few points are transferred from the lower rated player.
However if lower rated player wins, then transferred points from a higher rated player are far greater.

The algorithm is in app.js.

Read about elo algorithm here : https://en.wikipedia.org/wiki/Elo_rating_system
