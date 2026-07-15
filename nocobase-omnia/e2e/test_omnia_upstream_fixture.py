from fastapi.testclient import TestClient

from e2e.omnia_upstream_fixture import FIXTURE_TOKEN, FIXTURE_WORKSPACE, app


HEADERS = {
    "Authorization": f"Bearer {FIXTURE_TOKEN}",
    "X-Workspace": FIXTURE_WORKSPACE,
}


def test_fixture_requires_local_auth() -> None:
    with TestClient(app) as client:
        response = client.get("/apigateway/kunden/customers/search", params={"keywords": "Mara"})

    assert response.status_code == 401


def test_fixture_supports_customer_search_and_detail() -> None:
    with TestClient(app) as client:
        search = client.get(
            "/apigateway/kunden/customers/search",
            params={"keywords": "Mara"},
            headers=HEADERS,
        )
        detail = client.get(
            "/apigateway/kunden/customers/demo-customer-001",
            headers=HEADERS,
        )
        addresses = client.get(
            "/apigateway/kunden/customers/demo-customer-001/addresses",
            headers=HEADERS,
        )

    assert search.status_code == 200
    assert search.json()["numberOfElements"] == 1
    assert search.json()["content"][0]["id"] == "demo-customer-001"
    assert detail.status_code == 200
    assert detail.json()["customerNumber"] == 10001
    assert addresses.status_code == 200
    assert addresses.json()["content"][0]["city"] == "Demostadt"
