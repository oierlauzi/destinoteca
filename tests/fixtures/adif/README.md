# ADIF fixtures

All three are **recorded** on 2026-11-27, between 22:58 and 23:07 Madrid time,
with `tools/capture-adif.mjs`: the argument of the first `ReceiveMessage` the
hub at `wss://info.adif.es/InfoStation` sent for `PRO-ECM-<code>`, as it came.

- `puerta-de-atocha.json`: Madrid Puerta de Atocha-Almudena Grandes (`60000`),
  untouched. It carries a station alert, and a train joined from two origins
  (Logroño and Pamplona/Iruña).
- `jaen.json`: Jaén (`03100`), untouched. The hub's group name needs the code
  with its leading zero, while the board names the station `3100`.
- `chamartin.json`: Madrid Chamartín Clara Campoamor (`17000`), **trimmed** to
  eleven of its 303 trains, picked to cover the cases the client reads (a late
  Cercanías at its platform, a predicted pair of platforms, a cancelled train,
  trains ending here, two destinations under one or two identities, an
  identity restricted to the journey before this station, IRYO and OUIGO), and
  to the entries of `stations` those trains name. Nothing inside a train was
  changed, and `station_settings`, `multimedia_info` and `station_alerts` are
  as sent.

To refresh them, run the capture tool where Playwright is installed:

```sh
node tools/capture-adif.mjs /tmp/adif 60000 03100 17000
```
