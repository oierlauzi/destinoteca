# mitren.app fixtures

`arrivals_metro_bilbao.json` and `arrivals_euskotren.json` are **recorded**:
one `arrivals_update` each, as the server sent it, for San Mamés of Metro
Bilbao (`bilbao_metro`, station 10) and for Zazpikaleak/Casco Viejo of
Euskotren (`bilbao_euskotren`, station 2577), both on the evening of
2026-11-19. Nothing is trimmed, so they also show the fields the client
ignores.

`arrivals_update.json` and `train_update.json` are **synthetic**: mitren.app
could not be reached from the environment they were written in, so the frames
are built by hand from the shapes the client reads:
the fields documented in `renfe-flipdot-re`'s `web-replica/README.md` and used
by its `realtime.js` (upstream: `app/schemas/arrivals.py` for board rows,
`app/schemas/train_detail.py` for a train's stops). Station codes and names
are real ones from `stations.data.json`.

Replace those two with recorded frames when convenient: connect to
`wss://mitren.app/api/ws/trains/madrid_cercanias?listing=0`, send
`{"type":"subscriptions","station_ids":["17000"],"train_ids":[...]}` after the
first `subscribed`, and keep one `arrivals_update` and one `train_update`.
