package Internal.Websocket.Controller.EventHandlers;

import GameContext.Card.CardController;
import GameContext.Card.CardPOJO;
import GameContext.GameContext;
import Internal.UserInterface.UIController;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

public class UpdateCard implements WebsocketEventHandler {
    private UIController uiController;

    public UpdateCard(UIController uiController) {
        this.uiController = uiController;
    }


    @Override
    public void handler(GameContext ctx, JSONObject body){
//        JSONObject content = (JSONObject) body.get("content");
        JSONArray cards = (JSONArray) body.get("content");
        JSONObject host = (JSONObject) cards.get(0);
        JSONObject guest = (JSONObject) cards.get(1);
        String hostUsername = (String) host.get("username");
        String guestUsername = (String) guest.get("username");
        JSONArray hostCards = (JSONArray) host.get("cards");
        JSONArray guestCards = (JSONArray) guest.get("cards");

        for (Object c : hostCards){
            JSONObject cardObject = (JSONObject) c;
            CardPOJO card = CardController.getCARDS().get(cardObject.get("display"));
            ctx.getPlayer(hostUsername).getPOJO().getCardController().addCards(card);
        }
        for (Object c : guestCards){
            JSONObject cardObject = (JSONObject) c;
            CardPOJO card = CardController.getCARDS().get(cardObject.get("display"));
            ctx.getPlayer(guestUsername).getPOJO().getCardController().addCards(card);
        }
        uiController.update();
    }

}
