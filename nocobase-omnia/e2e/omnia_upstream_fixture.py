from fastapi import FastAPI, Header, HTTPException, Query


FIXTURE_TOKEN = "omnia-ui-fixture-token"
FIXTURE_WORKSPACE = "omnia-ui-fixture-workspace"

CUSTOMERS = {
    "demo-customer-001": {
        "id": "demo-customer-001",
        "customerNumber": 10001,
        "firstName": "Mara",
        "lastName": "Beispiel",
        "dateOfBirth": "1984-04-12",
        "email": "mara.beispiel@example.invalid",
        "phoneNumbers": [{"phoneType": "MOBILE", "phoneNumber": "+49 000 10001"}],
        "active": True,
    },
    "demo-customer-002": {
        "id": "demo-customer-002",
        "customerNumber": 10002,
        "firstName": "Jonas",
        "lastName": "Testmann",
        "dateOfBirth": "1977-09-03",
        "email": "jonas.testmann@example.invalid",
        "phoneNumbers": [{"phoneType": "PHONE", "phoneNumber": "+49 000 10002"}],
        "active": True,
    },
}

ADDRESSES = {
    "demo-customer-001": {
        "id": "demo-address-001",
        "addressType": "MAIN",
        "street": "Beispielweg",
        "houseNumber": "10",
        "zipCode": "00001",
        "city": "Demostadt",
        "mainAddress": True,
    },
    "demo-customer-002": {
        "id": "demo-address-002",
        "addressType": "MAIN",
        "street": "Testallee",
        "houseNumber": "20",
        "zipCode": "00002",
        "city": "Musterort",
        "mainAddress": True,
    },
}

app = FastAPI(title="Synthetic Omnia UI fixture")


@app.get("/__fixture/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def require_fixture_auth(authorization: str | None, workspace: str | None) -> None:
    if authorization != f"Bearer {FIXTURE_TOKEN}" or workspace != FIXTURE_WORKSPACE:
        raise HTTPException(status_code=401, detail="fixture_auth_required")


def page(content: list[dict]) -> dict:
    return {
        "content": content,
        "number": 0,
        "size": len(content),
        "numberOfElements": len(content),
        "totalElements": len(content),
        "totalPages": 1 if content else 0,
    }


@app.get("/apigateway/kunden/customers/search")
async def search_customers(
    keywords: str = Query(default=""),
    authorization: str | None = Header(default=None),
    x_workspace: str | None = Header(default=None, alias="X-Workspace"),
) -> dict:
    require_fixture_auth(authorization, x_workspace)
    needle = keywords.strip().casefold()
    content = [
        customer
        for customer in CUSTOMERS.values()
        if not needle
        or needle in f"{customer['firstName']} {customer['lastName']} {customer['customerNumber']}".casefold()
    ]
    return page(content)


@app.get("/apigateway/kunden/customers/{customer_id}")
async def customer_detail(
    customer_id: str,
    authorization: str | None = Header(default=None),
    x_workspace: str | None = Header(default=None, alias="X-Workspace"),
) -> dict:
    require_fixture_auth(authorization, x_workspace)
    customer = CUSTOMERS.get(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="fixture_customer_not_found")
    return customer


@app.get("/apigateway/kunden/customers/{customer_id}/addresses")
async def customer_addresses(
    customer_id: str,
    authorization: str | None = Header(default=None),
    x_workspace: str | None = Header(default=None, alias="X-Workspace"),
) -> dict:
    require_fixture_auth(authorization, x_workspace)
    address = ADDRESSES.get(customer_id)
    return page([address] if address else [])


@app.get("/apigateway/kunden/customers/{customer_id}/contacts")
async def customer_contacts(
    customer_id: str,
    authorization: str | None = Header(default=None),
    x_workspace: str | None = Header(default=None, alias="X-Workspace"),
) -> dict:
    require_fixture_auth(authorization, x_workspace)
    customer = CUSTOMERS.get(customer_id)
    if customer is None:
        return page([])
    return page([{"id": f"contact-{customer_id}", "phoneNumbers": customer["phoneNumbers"]}])


@app.get("/apigateway/kunden/customers/{customer_id}/notes")
async def customer_notes(
    customer_id: str,
    authorization: str | None = Header(default=None),
    x_workspace: str | None = Header(default=None, alias="X-Workspace"),
) -> dict:
    require_fixture_auth(authorization, x_workspace)
    return page([])


@app.get("/apigateway/salesprocessservice/salesprocesses/customer/{customer_id}/vorgang-ids")
async def customer_processes(
    customer_id: str,
    authorization: str | None = Header(default=None),
    x_workspace: str | None = Header(default=None, alias="X-Workspace"),
) -> list[dict[str, str]]:
    require_fixture_auth(authorization, x_workspace)
    if customer_id not in CUSTOMERS:
        return []
    return [{"id": f"demo-process-{customer_id}", "number": "V-TEST-1", "status": "OPEN"}]
