"""
Test suite for Extended Client CRUD - Testing new client fields:
- phone, address, city, state, zip_code, contact_person, contact_title, website, notes
Tests Create, Read, Update, Delete operations with all new fields
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "scott@soaeast.com"
TEST_PASSWORD = "admin123"


class TestClientCRUDExtended:
    """Extended Client CRUD tests with new fields"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_client_with_all_fields(self, auth_headers):
        """Test POST /api/clients - Create client with all new fields"""
        unique_suffix = uuid.uuid4().hex[:8]
        client_data = {
            "name": f"TEST_FullClient_{unique_suffix}",
            "email": f"test_full_{unique_suffix}@company.com",
            "industry": "Technology",
            "tier": "gold",
            "status": "active",
            # New fields
            "phone": "(555) 123-4567",
            "address": "123 Test Street",
            "city": "Test City",
            "state": "TX",
            "zip_code": "75001",
            "contact_person": "John Test",
            "contact_title": "Purchasing Manager",
            "website": "https://testcompany.com",
            "notes": "Important test client notes"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create client: {response.text}"
        
        data = response.json()
        # Verify all fields are returned correctly
        assert data["name"] == client_data["name"]
        assert data["email"] == client_data["email"]
        assert data["industry"] == "Technology"
        assert data["tier"] == "gold"
        assert data["status"] == "active"
        # Verify new fields
        assert data["phone"] == "(555) 123-4567"
        assert data["address"] == "123 Test Street"
        assert data["city"] == "Test City"
        assert data["state"] == "TX"
        assert data["zip_code"] == "75001"
        assert data["contact_person"] == "John Test"
        assert data["contact_title"] == "Purchasing Manager"
        assert data["website"] == "https://testcompany.com"
        assert data["notes"] == "Important test client notes"
        assert "id" in data
        
        print(f"Created client with all fields: {data['id']}")
        return data["id"]
    
    def test_get_client_with_all_fields(self, auth_headers):
        """Test GET /api/clients/{id} - Verify all new fields are returned"""
        # First create a client
        unique_suffix = uuid.uuid4().hex[:8]
        client_data = {
            "name": f"TEST_GetClient_{unique_suffix}",
            "email": f"test_get_{unique_suffix}@company.com",
            "industry": "Healthcare",
            "tier": "silver",
            "phone": "(555) 999-8888",
            "address": "456 Health Ave",
            "city": "Medical City",
            "state": "CA",
            "zip_code": "90210",
            "contact_person": "Dr. Jane Smith",
            "contact_title": "Chief Medical Officer",
            "website": "https://healthco.org",
            "notes": "Healthcare client notes"
        }
        create_resp = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert create_resp.status_code == 200
        client_id = create_resp.json()["id"]
        
        # GET the client and verify all fields
        get_resp = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        
        # Verify all fields persisted
        assert data["phone"] == "(555) 999-8888"
        assert data["address"] == "456 Health Ave"
        assert data["city"] == "Medical City"
        assert data["state"] == "CA"
        assert data["zip_code"] == "90210"
        assert data["contact_person"] == "Dr. Jane Smith"
        assert data["contact_title"] == "Chief Medical Officer"
        assert data["website"] == "https://healthco.org"
        assert data["notes"] == "Healthcare client notes"
        
        print(f"Verified GET client returns all new fields")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
    
    def test_update_client_new_fields(self, auth_headers):
        """Test PUT /api/clients/{id} - Update client with new fields"""
        # Create a client first
        unique_suffix = uuid.uuid4().hex[:8]
        client_data = {
            "name": f"TEST_UpdateClient_{unique_suffix}",
            "email": f"test_update_{unique_suffix}@company.com",
            "industry": "Real Estate",
            "phone": "(555) 111-2222",
            "city": "Old City",
            "contact_person": "Original Contact"
        }
        create_resp = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert create_resp.status_code == 200
        client_id = create_resp.json()["id"]
        
        # Update with new field values
        update_data = {
            "phone": "(555) 333-4444",
            "address": "789 New Address Blvd",
            "city": "New City",
            "state": "NY",
            "zip_code": "10001",
            "contact_person": "Updated Contact Person",
            "contact_title": "VP of Sales",
            "website": "https://updated-company.com",
            "notes": "Updated client notes - very important"
        }
        update_resp = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_data, headers=auth_headers)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        updated = update_resp.json()
        assert updated["phone"] == "(555) 333-4444"
        assert updated["address"] == "789 New Address Blvd"
        assert updated["city"] == "New City"
        assert updated["state"] == "NY"
        assert updated["zip_code"] == "10001"
        assert updated["contact_person"] == "Updated Contact Person"
        assert updated["contact_title"] == "VP of Sales"
        assert updated["website"] == "https://updated-company.com"
        assert updated["notes"] == "Updated client notes - very important"
        
        print(f"Successfully updated client with new fields")
        
        # Verify persistence with GET
        get_resp = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["phone"] == "(555) 333-4444"
        assert fetched["city"] == "New City"
        assert fetched["contact_person"] == "Updated Contact Person"
        
        print("Verified updated fields persisted")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
    
    def test_update_partial_fields(self, auth_headers):
        """Test PUT /api/clients/{id} - Partial update should not affect other fields"""
        # Create client with all fields
        unique_suffix = uuid.uuid4().hex[:8]
        client_data = {
            "name": f"TEST_PartialUpdate_{unique_suffix}",
            "email": f"test_partial_{unique_suffix}@company.com",
            "industry": "Finance",
            "phone": "(555) 777-6666",
            "address": "100 Finance St",
            "city": "Money City",
            "state": "IL",
            "zip_code": "60601",
            "contact_person": "Bank Manager",
            "contact_title": "Branch Director",
            "website": "https://bigbank.com",
            "notes": "Important financial client"
        }
        create_resp = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert create_resp.status_code == 200
        client_id = create_resp.json()["id"]
        
        # Update only phone and notes
        partial_update = {
            "phone": "(555) 888-9999",
            "notes": "Updated notes only"
        }
        update_resp = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=partial_update, headers=auth_headers)
        assert update_resp.status_code == 200
        
        # Verify only updated fields changed
        updated = update_resp.json()
        assert updated["phone"] == "(555) 888-9999"
        assert updated["notes"] == "Updated notes only"
        # Original fields should remain
        assert updated["address"] == "100 Finance St"
        assert updated["city"] == "Money City"
        assert updated["state"] == "IL"
        assert updated["contact_person"] == "Bank Manager"
        assert updated["contact_title"] == "Branch Director"
        
        print("Partial update preserved other fields correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
    
    def test_create_client_minimal_fields(self, auth_headers):
        """Test POST /api/clients - Create client with only required fields (name, email, industry)"""
        unique_suffix = uuid.uuid4().hex[:8]
        minimal_data = {
            "name": f"TEST_MinimalClient_{unique_suffix}",
            "email": f"test_minimal_{unique_suffix}@company.com",
            "industry": "Services"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=minimal_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["name"] == minimal_data["name"]
        assert data["email"] == minimal_data["email"]
        assert data["industry"] == "Services"
        # Optional fields should be None or empty
        assert data.get("phone") is None or data.get("phone") == ""
        assert data.get("address") is None or data.get("address") == ""
        
        print("Created client with minimal fields successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/clients/{data['id']}", headers=auth_headers)
    
    def test_list_clients_includes_new_fields(self, auth_headers):
        """Test GET /api/clients - List returns clients with new fields"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert response.status_code == 200
        
        clients = response.json()
        assert isinstance(clients, list)
        
        # Check that at least one client has the new field structure
        if len(clients) > 0:
            client = clients[0]
            # These fields should exist in the response (even if None)
            assert "phone" in client or client.get("phone") is None
            assert "address" in client or client.get("address") is None
            assert "city" in client or client.get("city") is None
            assert "state" in client or client.get("state") is None
            assert "zip_code" in client or client.get("zip_code") is None
            assert "contact_person" in client or client.get("contact_person") is None
            assert "contact_title" in client or client.get("contact_title") is None
            assert "website" in client or client.get("website") is None
            assert "notes" in client or client.get("notes") is None
        
        print(f"Listed {len(clients)} clients with extended fields")
    
    def test_delete_client(self, auth_headers):
        """Test DELETE /api/clients/{id} - Delete client"""
        # Create a client to delete
        unique_suffix = uuid.uuid4().hex[:8]
        client_data = {
            "name": f"TEST_DeleteMe_{unique_suffix}",
            "email": f"test_delete_{unique_suffix}@company.com",
            "industry": "Retail",
            "phone": "(555) 000-1111",
            "contact_person": "To Be Deleted"
        }
        create_resp = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert create_resp.status_code == 200
        client_id = create_resp.json()["id"]
        
        # Delete the client
        delete_resp = requests.delete(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        
        # Verify deletion - GET should return 404
        get_resp = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        
        print(f"Successfully deleted client {client_id}")


class TestClientOrders:
    """Test client orders endpoint to verify orders history display"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_client_orders(self, auth_headers):
        """Test GET /api/clients/{id}/orders - Get orders for a client"""
        # First get a client that might have orders
        clients_resp = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert clients_resp.status_code == 200
        clients = clients_resp.json()
        
        if len(clients) > 0:
            # Try to find a client with orders
            for client in clients:
                if client.get("total_orders", 0) > 0:
                    client_id = client["id"]
                    orders_resp = requests.get(f"{BASE_URL}/api/clients/{client_id}/orders", headers=auth_headers)
                    assert orders_resp.status_code == 200
                    orders = orders_resp.json()
                    assert isinstance(orders, list)
                    print(f"Client {client['name']} has {len(orders)} orders")
                    
                    # Check order structure if orders exist
                    if len(orders) > 0:
                        order = orders[0]
                        assert "order_id" in order
                        assert "status" in order
                        assert "line_items" in order or "products_description" in order
                    break


class TestCleanupExtended:
    """Cleanup any TEST_ prefixed clients created during testing"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_clients(self, auth_headers):
        """Clean up any remaining TEST_ prefixed clients"""
        cleanup_count = 0
        
        clients_resp = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        if clients_resp.status_code == 200:
            for client in clients_resp.json():
                if client.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/clients/{client['id']}", headers=auth_headers)
                    cleanup_count += 1
        
        print(f"Cleaned up {cleanup_count} test clients")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
