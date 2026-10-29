"""Inference endpoint, deployed on GCP (Cloud Run with GPU).

Contract (dermiai_schemas): POST a `DermiRequest` JSON body, and get back a Server-Sent Events
stream of `DermiStreamEvent`: `status`* (e.g. during a cold start), `delta`* (tokens), then exactly
one `done` (the full DermiResponse) or `error`. The web app's /api/consult route is the only caller.
"""
