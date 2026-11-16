# mitren.app fixtures

**Synthetic.** mitren.app could not be reached from the environment these were
written in, so the frames are built by hand from the shapes the client reads:
the fields documented in `renfe-flipdot-re`'s `web-replica/README.md` and used
by its `realtime.js` (upstream: `app/schemas/arrivals.py` for board rows,
`app/schemas/train_detail.py` for a train's stops). Station codes and names
are real ones from `stations.data.json`.

Replace them with recorded frames when convenient: connect to
`wss://mitren.app/api/ws/trains/madrid_cercanias?listing=0`, send
`{"type":"subscriptions","station_ids":["17000"],"train_ids":[...]}` after the
first `subscribed`, and keep one `arrivals_update` and one `train_update`.
