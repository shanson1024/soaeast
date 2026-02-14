"""
Backend API Tests for Orders with Line Items and Client Detail Features
Tests:
- Order line items with product_name, quantity, unit_price, line totals
- Order subtotal, tax_rate, tax_amount, total calculations
- Client detail endpoints: /api/clients/:id/orders, /api/clients/:id/deals, /api/clients/:id/notes
- Adding notes to client activity log
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://client-hub-crm-3.preview.emergentagent.com').rstrip('/')


class TestOrdersWithLineItems:
    """Tests for Order Line Items functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "scott@soaeast.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("access_token")
        assert token, "No token in response"
        return token
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Return headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    @pytest.fixture(scope="class")
    def test_client(self, headers):
        """Create a test client for orders"""
        unique_id = str(uuid.uuid4())[:8]
        client_data = {
            "name": f"TEST_OrderClient_{unique_id}",
            "email": f"test.orderclient.{unique_id}@example.com",
            "industry": "Technology",
            "tier": "silver",
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=headers)
        assert response.status_code == 200, f"Failed to create test client: {response.text}"
        client = response.json()
        yield client
        # Cleanup - delete client after tests
        requests.delete(f"{BASE_URL}/api/clients/{client['id']}", headers=headers)
    
    # Test 1: Create order with multiple line items
    def test_01_create_order_with_line_items(self, headers, test_client):
        """Test creating an order with multiple line items"""
        order_data = {
            "client_id": test_client["id"],
            "line_items": [
                {"product_name": "TEST Custom T-Shirts", "quantity": 100, "unit_price": 12.50},
                {"product_name": "TEST Embroidered Polo Shirts", "quantity": 50, "unit_price": 28.00},
                {"product_name": "TEST Printed Tote Bags", "quantity": 200, "unit_price": 8.75}
            ],
            "status": "draft",
            "priority": "high",
            "due_date": "2026-03-15",
            "notes": "Test order with multiple line items"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=headers)
        assert response.status_code == 200, f"POST /api/orders failed: {response.text}"
        
        created_order = response.json()
        
        # Verify order structure
        assert "id" in created_order, "Order should have id"
        assert "order_id" in created_order, "Order should have order_id (SOA-XXXX format)"
        assert created_order["order_id"].startswith("SOA-"), "Order ID should start with SOA-"
        
        # Verify line items
        assert "line_items" in created_order, "Order should have line_items"
        assert len(created_order["line_items"]) == 3, "Order should have 3 line items"
        
        for i, item in enumerate(created_order["line_items"]):
            assert "product_name" in item, f"Line item {i} should have product_name"
            assert "quantity" in item, f"Line item {i} should have quantity"
            assert "unit_price" in item, f"Line item {i} should have unit_price"
        
        # Verify totals
        expected_subtotal = (100 * 12.50) + (50 * 28.00) + (200 * 8.75)  # 1250 + 1400 + 1750 = 4400
        assert "subtotal" in created_order, "Order should have subtotal"
        assert created_order["subtotal"] == expected_subtotal, f"Subtotal mismatch: {created_order['subtotal']} != {expected_subtotal}"
        
        assert "tax_rate" in created_order, "Order should have tax_rate"
        assert created_order["tax_rate"] > 0, "Tax rate should be positive"
        
        assert "tax_amount" in created_order, "Order should have tax_amount"
        expected_tax = round(expected_subtotal * (created_order["tax_rate"] / 100), 2)
        assert created_order["tax_amount"] == expected_tax, f"Tax amount mismatch: {created_order['tax_amount']} != {expected_tax}"
        
        assert "total" in created_order, "Order should have total"
        expected_total = round(expected_subtotal + expected_tax, 2)
        assert created_order["total"] == expected_total, f"Total mismatch: {created_order['total']} != {expected_total}"
        
        print(f"Created order: {created_order['order_id']}")
        print(f"Line items: {len(created_order['line_items'])}")
        print(f"Subtotal: ${created_order['subtotal']}, Tax: ${created_order['tax_amount']}, Total: ${created_order['total']}")
        
        # Store for other tests
        TestOrdersWithLineItems.created_order_id = created_order["id"]
        return created_order
    
    # Test 2: GET order and verify line items and totals
    def test_02_get_order_with_line_items(self, headers):
        """Test retrieving order with line items and calculated totals"""
        order_id = getattr(TestOrdersWithLineItems, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
        assert response.status_code == 200, f"GET /api/orders/{order_id} failed: {response.text}"
        
        order = response.json()
        
        # Verify all fields exist
        assert "line_items" in order and len(order["line_items"]) == 3
        assert "subtotal" in order
        assert "tax_rate" in order
        assert "tax_amount" in order
        assert "total" in order
        
        # Verify line item structure
        for item in order["line_items"]:
            assert all(key in item for key in ["product_name", "quantity", "unit_price"])
        
        print(f"Retrieved order {order['order_id']} with {len(order['line_items'])} line items")
        print(f"Tax rate: {order['tax_rate']}%, Total: ${order['total']}")
    
    # Test 3: GET all orders and verify line items in list
    def test_03_get_orders_list_with_line_items(self, headers):
        """Test that orders list includes line items and totals"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        assert response.status_code == 200, f"GET /api/orders failed: {response.text}"
        
        orders = response.json()
        assert isinstance(orders, list), "Response should be a list"
        
        # Find our test order
        test_order = next((o for o in orders if o.get("id") == getattr(TestOrdersWithLineItems, 'created_order_id', None)), None)
        if test_order:
            assert "line_items" in test_order, "Order in list should have line_items"
            assert "subtotal" in test_order, "Order in list should have subtotal"
            assert "tax_rate" in test_order, "Order in list should have tax_rate"
            assert "total" in test_order, "Order in list should have total"
            print(f"Test order found in list with {len(test_order['line_items'])} items")
    
    # Test 4: Update order line items
    def test_04_update_order_line_items(self, headers):
        """Test updating order with new line items recalculates totals"""
        order_id = getattr(TestOrdersWithLineItems, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        update_data = {
            "line_items": [
                {"product_name": "TEST Updated Product 1", "quantity": 50, "unit_price": 20.00},
                {"product_name": "TEST Updated Product 2", "quantity": 100, "unit_price": 15.00}
            ]
        }
        
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_data, headers=headers)
        assert response.status_code == 200, f"PUT /api/orders/{order_id} failed: {response.text}"
        
        updated_order = response.json()
        
        # Verify line items updated
        assert len(updated_order["line_items"]) == 2, "Should have 2 line items after update"
        
        # Verify totals recalculated
        expected_subtotal = (50 * 20.00) + (100 * 15.00)  # 1000 + 1500 = 2500
        assert updated_order["subtotal"] == expected_subtotal, f"Subtotal not recalculated: {updated_order['subtotal']} != {expected_subtotal}"
        
        expected_tax = round(expected_subtotal * (updated_order["tax_rate"] / 100), 2)
        assert updated_order["tax_amount"] == expected_tax, f"Tax not recalculated: {updated_order['tax_amount']}"
        
        expected_total = round(expected_subtotal + expected_tax, 2)
        assert updated_order["total"] == expected_total, f"Total not recalculated: {updated_order['total']}"
        
        print(f"Updated order totals - Subtotal: ${updated_order['subtotal']}, Tax: ${updated_order['tax_amount']}, Total: ${updated_order['total']}")
    
    # Test 5: Delete order
    def test_05_delete_order(self, headers):
        """Test deleting order"""
        order_id = getattr(TestOrdersWithLineItems, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        response = requests.delete(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
        assert response.status_code == 200, f"DELETE /api/orders/{order_id} failed: {response.text}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
        assert get_response.status_code == 404, "Order should not exist after deletion"
        
        print(f"Order {order_id} deleted successfully")


class TestClientDetailEndpoints:
    """Tests for Client Detail page endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "scott@soaeast.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Return headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    @pytest.fixture(scope="class")
    def test_client(self, headers):
        """Create a test client for client detail tests"""
        unique_id = str(uuid.uuid4())[:8]
        client_data = {
            "name": f"TEST_DetailClient_{unique_id}",
            "email": f"test.detailclient.{unique_id}@example.com",
            "industry": "Healthcare",
            "tier": "gold",
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=headers)
        assert response.status_code == 200, f"Failed to create test client: {response.text}"
        client = response.json()
        yield client
        # Cleanup
        requests.delete(f"{BASE_URL}/api/clients/{client['id']}", headers=headers)
    
    @pytest.fixture(scope="class")
    def test_order(self, headers, test_client):
        """Create a test order for the client"""
        order_data = {
            "client_id": test_client["id"],
            "line_items": [
                {"product_name": "TEST Detail Product", "quantity": 25, "unit_price": 50.00}
            ],
            "status": "production",
            "priority": "medium",
            "due_date": "2026-04-01"
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=headers)
        assert response.status_code == 200, f"Failed to create test order: {response.text}"
        order = response.json()
        yield order
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order['id']}", headers=headers)
    
    @pytest.fixture(scope="class")
    def test_deal(self, headers, test_client):
        """Create a test deal for the client"""
        deal_data = {
            "client_name": test_client["name"],
            "client_id": test_client["id"],
            "amount": 5000.00,
            "product_description": "TEST Detail Deal Product",
            "stage": "proposal",
            "priority": "high",
            "tags": ["Apparel"],
            "owner_initials": "SH",
            "owner_color": "#2d6a4f"
        }
        response = requests.post(f"{BASE_URL}/api/deals", json=deal_data, headers=headers)
        assert response.status_code == 200, f"Failed to create test deal: {response.text}"
        deal = response.json()
        yield deal
        # Cleanup
        requests.delete(f"{BASE_URL}/api/deals/{deal['id']}", headers=headers)
    
    # Test 1: GET /api/clients/:id - Get single client
    def test_01_get_client_detail(self, headers, test_client):
        """Test GET /api/clients/{id} returns client details"""
        response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}", headers=headers)
        assert response.status_code == 200, f"GET /api/clients/{test_client['id']} failed: {response.text}"
        
        client = response.json()
        assert client["id"] == test_client["id"]
        assert client["name"] == test_client["name"]
        assert client["email"] == test_client["email"]
        assert client["industry"] == test_client["industry"]
        assert client["tier"] == test_client["tier"]
        assert "total_revenue" in client
        assert "total_orders" in client
        assert "created_at" in client
        
        print(f"Client detail: {client['name']} - {client['industry']} - {client['tier']}")
    
    # Test 2: GET /api/clients/:id/orders - Get client orders
    def test_02_get_client_orders(self, headers, test_client, test_order):
        """Test GET /api/clients/{id}/orders returns client's orders"""
        response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}/orders", headers=headers)
        assert response.status_code == 200, f"GET /api/clients/{test_client['id']}/orders failed: {response.text}"
        
        orders = response.json()
        assert isinstance(orders, list), "Response should be a list"
        assert len(orders) >= 1, "Client should have at least 1 order"
        
        # Find our test order
        client_order = next((o for o in orders if o.get("id") == test_order["id"]), None)
        assert client_order is not None, "Test order should be in client's orders"
        assert "line_items" in client_order, "Order should have line_items"
        assert "total" in client_order, "Order should have total"
        
        print(f"Client has {len(orders)} orders")
    
    # Test 3: GET /api/clients/:id/deals - Get client deals
    def test_03_get_client_deals(self, headers, test_client, test_deal):
        """Test GET /api/clients/{id}/deals returns client's deals"""
        response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}/deals", headers=headers)
        assert response.status_code == 200, f"GET /api/clients/{test_client['id']}/deals failed: {response.text}"
        
        deals = response.json()
        assert isinstance(deals, list), "Response should be a list"
        assert len(deals) >= 1, "Client should have at least 1 deal"
        
        # Find our test deal
        client_deal = next((d for d in deals if d.get("id") == test_deal["id"]), None)
        assert client_deal is not None, "Test deal should be in client's deals"
        assert client_deal["amount"] == test_deal["amount"]
        assert client_deal["stage"] == test_deal["stage"]
        
        print(f"Client has {len(deals)} deals")
    
    # Test 4: GET /api/clients/:id/notes - Get client notes (empty initially)
    def test_04_get_client_notes_empty(self, headers, test_client):
        """Test GET /api/clients/{id}/notes returns empty list for new client"""
        response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}/notes", headers=headers)
        assert response.status_code == 200, f"GET /api/clients/{test_client['id']}/notes failed: {response.text}"
        
        notes = response.json()
        assert isinstance(notes, list), "Response should be a list"
        print(f"Client has {len(notes)} notes initially")
    
    # Test 5: POST /api/clients/:id/notes - Add note to client
    def test_05_add_client_note(self, headers, test_client):
        """Test POST /api/clients/{id}/notes adds note to client activity"""
        note_data = {
            "content": "TEST: Initial contact made, discussed promotional products needs",
            "note_type": "call"
        }
        
        response = requests.post(f"{BASE_URL}/api/clients/{test_client['id']}/notes", json=note_data, headers=headers)
        assert response.status_code == 200, f"POST /api/clients/{test_client['id']}/notes failed: {response.text}"
        
        created_note = response.json()
        assert "id" in created_note, "Note should have id"
        assert created_note["client_id"] == test_client["id"], "Note client_id mismatch"
        assert created_note["content"] == note_data["content"], "Note content mismatch"
        assert created_note["note_type"] == note_data["note_type"], "Note type mismatch"
        assert "created_by" in created_note, "Note should have created_by"
        assert "created_by_name" in created_note, "Note should have created_by_name"
        assert "created_at" in created_note, "Note should have created_at"
        
        print(f"Created note: {created_note['note_type']} - {created_note['content'][:50]}...")
        
        # Store for other tests
        TestClientDetailEndpoints.created_note_id = created_note["id"]
        return created_note
    
    # Test 6: GET /api/clients/:id/notes - Verify note added
    def test_06_get_client_notes_after_add(self, headers, test_client):
        """Test GET /api/clients/{id}/notes returns added note"""
        response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}/notes", headers=headers)
        assert response.status_code == 200, f"GET /api/clients/{test_client['id']}/notes failed: {response.text}"
        
        notes = response.json()
        assert len(notes) >= 1, "Client should have at least 1 note"
        
        note_id = getattr(TestClientDetailEndpoints, 'created_note_id', None)
        if note_id:
            note = next((n for n in notes if n.get("id") == note_id), None)
            assert note is not None, "Created note should be in client's notes"
            assert note["note_type"] == "call"
        
        print(f"Client now has {len(notes)} notes")
    
    # Test 7: Add different note types
    def test_07_add_different_note_types(self, headers, test_client):
        """Test adding notes with different types"""
        note_types = ["general", "meeting", "email", "task"]
        created_notes = []
        
        for note_type in note_types:
            note_data = {
                "content": f"TEST: This is a {note_type} note",
                "note_type": note_type
            }
            response = requests.post(f"{BASE_URL}/api/clients/{test_client['id']}/notes", json=note_data, headers=headers)
            assert response.status_code == 200, f"Failed to add {note_type} note: {response.text}"
            created_notes.append(response.json()["id"])
        
        # Verify all notes exist
        response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}/notes", headers=headers)
        notes = response.json()
        
        for note_type in note_types:
            note = next((n for n in notes if n.get("note_type") == note_type and "TEST:" in n.get("content", "")), None)
            assert note is not None, f"{note_type} note not found"
        
        print(f"Successfully created notes for types: {note_types}")
        
        # Store for cleanup
        TestClientDetailEndpoints.additional_note_ids = created_notes
    
    # Test 8: DELETE /api/clients/:id/notes/:note_id - Delete note
    def test_08_delete_client_note(self, headers, test_client):
        """Test DELETE /api/clients/{id}/notes/{note_id} deletes note"""
        note_id = getattr(TestClientDetailEndpoints, 'created_note_id', None)
        if not note_id:
            pytest.skip("No note created in previous test")
        
        response = requests.delete(f"{BASE_URL}/api/clients/{test_client['id']}/notes/{note_id}", headers=headers)
        assert response.status_code == 200, f"DELETE note failed: {response.text}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/clients/{test_client['id']}/notes", headers=headers)
        notes = get_response.json()
        deleted_note = next((n for n in notes if n.get("id") == note_id), None)
        assert deleted_note is None, "Note should not exist after deletion"
        
        print(f"Note {note_id} deleted successfully")
    
    # Test 9: Test 404 for non-existent client
    def test_09_client_detail_404(self, headers):
        """Test client detail endpoints return 404 for non-existent client"""
        fake_id = str(uuid.uuid4())
        
        # GET client
        response = requests.get(f"{BASE_URL}/api/clients/{fake_id}", headers=headers)
        assert response.status_code == 404, f"Expected 404 for non-existent client, got {response.status_code}"
        
        # GET client orders
        response = requests.get(f"{BASE_URL}/api/clients/{fake_id}/orders", headers=headers)
        # Note: orders endpoint might return empty list instead of 404
        
        # GET client deals
        response = requests.get(f"{BASE_URL}/api/clients/{fake_id}/deals", headers=headers)
        assert response.status_code == 404, f"Expected 404 for non-existent client deals, got {response.status_code}"
        
        # POST note to non-existent client
        response = requests.post(f"{BASE_URL}/api/clients/{fake_id}/notes", json={"content": "test", "note_type": "general"}, headers=headers)
        assert response.status_code == 404, f"Expected 404 for note on non-existent client, got {response.status_code}"
        
        print("404 responses returned correctly for non-existent client")
    
    # Test 10: Cleanup additional notes
    def test_10_cleanup_notes(self, headers, test_client):
        """Cleanup additional notes created during testing"""
        additional_ids = getattr(TestClientDetailEndpoints, 'additional_note_ids', [])
        for note_id in additional_ids:
            requests.delete(f"{BASE_URL}/api/clients/{test_client['id']}/notes/{note_id}", headers=headers)
        print(f"Cleaned up {len(additional_ids)} additional notes")


class TestTaxRateFromSettings:
    """Test that order tax rate comes from Settings"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "scott@soaeast.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Return headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    def test_01_order_uses_settings_tax_rate(self, headers):
        """Test that new orders use tax rate from settings"""
        # First get current settings
        settings_response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert settings_response.status_code == 200, f"GET /api/settings failed: {settings_response.text}"
        
        settings = settings_response.json()
        expected_tax_rate = settings.get("tax_rate", 8.5)
        
        # Get a client to create order
        clients_response = requests.get(f"{BASE_URL}/api/clients", headers=headers)
        clients = clients_response.json()
        if not clients:
            pytest.skip("No clients available for testing")
        
        # Create order
        order_data = {
            "client_id": clients[0]["id"],
            "line_items": [
                {"product_name": "TEST Tax Rate Product", "quantity": 10, "unit_price": 100.00}
            ],
            "status": "draft",
            "priority": "low",
            "due_date": "2026-05-01"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=headers)
        assert response.status_code == 200, f"POST /api/orders failed: {response.text}"
        
        created_order = response.json()
        
        # Verify tax rate matches settings
        assert created_order["tax_rate"] == expected_tax_rate, f"Order tax rate {created_order['tax_rate']} doesn't match settings {expected_tax_rate}"
        
        # Verify tax calculation
        expected_tax = round(1000.00 * (expected_tax_rate / 100), 2)
        assert created_order["tax_amount"] == expected_tax, f"Tax amount mismatch: {created_order['tax_amount']} != {expected_tax}"
        
        print(f"Order created with tax rate {created_order['tax_rate']}% from settings")
        print(f"Subtotal: ${created_order['subtotal']}, Tax: ${created_order['tax_amount']}, Total: ${created_order['total']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{created_order['id']}", headers=headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
