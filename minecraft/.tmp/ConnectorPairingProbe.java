import com.casimirbot.helixsensor.pairing.ConnectorPairingClient;

public final class ConnectorPairingProbe {
    public static void main(String[] args) throws Exception {
        try (ConnectorPairingClient client = new ConnectorPairingClient()) {
            client.redeem(
                "http://127.0.0.1:55066/api/environment-connectors/v1/pairing/redeem",
                "AAAA-AAAA",
                ConnectorPairingClient.newRedemptionNonce(),
                "minecraft.fabric_mod.v1",
                "probe"
            );
            System.out.println("unexpected_success");
        } catch (ConnectorPairingClient.PairingException error) {
            System.out.println(error.code() + ":" + error.statusCode());
        }
    }
}
