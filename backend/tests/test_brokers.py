"""
Backend API Tests for Brokers Feature
Tests CRUD operations for the /api/brokers endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-soa-east.preview.emergentagent.com').rstrip('/')

class TestBrokersAPI:
    """Brokers endpoint tests"""
    
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
    
    # GET /api/brokers - List all brokers
    def test_01_get_brokers_list(self, headers):
        """Test GET /api/brokers returns list of brokers"""
        response = requests.get(f"{BASE_URL}/api/brokers", headers=headers)
        assert response.status_code == 200, f"GET /api/brokers failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} brokers")
        return data
    
    # POST /api/brokers - Create new broker
    def test_02_create_broker(self, headers):
        """Test POST /api/brokers creates a new broker"""
        unique_id = str(uuid.uuid4())[:8]
        broker_data = {
            "name": f"TEST_Broker_{unique_id}",
            "company": f"TEST_Company_{unique_id}",
            "email": f"test.broker.{unique_id}@example.com",
            "phone": "(555) 123-4567",
            "territory": "Northeast",
            "commission_rate": 12.5,
            "status": "active",
            "notes": "Test broker created by automated tests"
        }
        response = requests.post(f"{BASE_URL}/api/brokers", json=broker_data, headers=headers)
        assert response.status_code == 200, f"POST /api/brokers failed: {response.text}"
        
        created_broker = response.json()
        assert "id" in created_broker, "Response should have id"
        assert created_broker["name"] == broker_data["name"], "Name mismatch"
        assert created_broker["company"] == broker_data["company"], "Company mismatch"
        assert created_broker["email"] == broker_data["email"], "Email mismatch"
        assert created_broker["commission_rate"] == broker_data["commission_rate"], "Commission rate mismatch"
        assert created_broker["status"] == broker_data["status"], "Status mismatch"
        assert created_broker["total_sales"] == 0, "Initial total_sales should be 0"
        assert created_broker["total_deals"] == 0, "Initial total_deals should be 0"
        
        print(f"Created broker: {created_broker['id']}")
        # Store broker_id for other tests
        TestBrokersAPI.created_broker_id = created_broker["id"]
        return created_broker
    
    # GET /api/brokers/{broker_id} - Get single broker
    def test_03_get_single_broker(self, headers):
        """Test GET /api/brokers/{id} returns correct broker"""
        broker_id = getattr(TestBrokersAPI, 'created_broker_id', None)
        if not broker_id:
            pytest.skip("No broker created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/brokers/{broker_id}", headers=headers)
        assert response.status_code == 200, f"GET /api/brokers/{broker_id} failed: {response.text}"
        
        broker = response.json()
        assert broker["id"] == broker_id, "ID mismatch"
        print(f"Retrieved broker: {broker['name']}")
    
    # PUT /api/brokers/{broker_id} - Update broker
    def test_04_update_broker(self, headers):
        """Test PUT /api/brokers/{id} updates broker"""
        broker_id = getattr(TestBrokersAPI, 'created_broker_id', None)
        if not broker_id:
            pytest.skip("No broker created in previous test")
        
        update_data = {
            "name": "TEST_Updated_Broker",
            "commission_rate": 15.0,
            "territory": "West Coast",
            "status": "inactive"
        }
        response = requests.put(f"{BASE_URL}/api/brokers/{broker_id}", json=update_data, headers=headers)
        assert response.status_code == 200, f"PUT /api/brokers/{broker_id} failed: {response.text}"
        
        updated_broker = response.json()
        assert updated_broker["name"] == update_data["name"], "Name not updated"
        assert updated_broker["commission_rate"] == update_data["commission_rate"], "Commission rate not updated"
        assert updated_broker["territory"] == update_data["territory"], "Territory not updated"
        assert updated_broker["status"] == update_data["status"], "Status not updated"
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/brokers/{broker_id}", headers=headers)
        assert get_response.status_code == 200
        fetched_broker = get_response.json()
        assert fetched_broker["name"] == update_data["name"], "Name not persisted"
        print(f"Updated broker: {updated_broker['name']}")
    
    # GET /api/brokers?status={status} - Filter by status
    def test_05_filter_brokers_by_status(self, headers):
        """Test GET /api/brokers with status filter"""
        response = requests.get(f"{BASE_URL}/api/brokers?status=inactive", headers=headers)
        assert response.status_code == 200, f"GET /api/brokers?status=inactive failed: {response.text}"
        
        data = response.json()
        for broker in data:
            assert broker["status"] == "inactive", f"Broker {broker['name']} has wrong status"
        print(f"Found {len(data)} inactive brokers")
    
    # GET /api/brokers?search={term} - Search brokers
    def test_06_search_brokers(self, headers):
        """Test GET /api/brokers with search query"""
        response = requests.get(f"{BASE_URL}/api/brokers?search=TEST", headers=headers)
        assert response.status_code == 200, f"GET /api/brokers?search=TEST failed: {response.text}"
        
        data = response.json()
        for broker in data:
            assert "TEST" in broker["name"].upper() or "TEST" in broker["company"].upper() or "TEST" in broker["email"].upper(), \
                f"Broker {broker['name']} doesn't match search term"
        print(f"Found {len(data)} brokers matching 'TEST'")
    
    # POST /api/brokers/{broker_id}/record-sale - Record sale
    def test_07_record_broker_sale(self, headers):
        """Test POST /api/brokers/{id}/record-sale"""
        broker_id = getattr(TestBrokersAPI, 'created_broker_id', None)
        if not broker_id:
            pytest.skip("No broker created in previous test")
        
        # First get current stats
        get_response = requests.get(f"{BASE_URL}/api/brokers/{broker_id}", headers=headers)
        current_broker = get_response.json()
        current_sales = current_broker["total_sales"]
        current_deals = current_broker["total_deals"]
        
        # Record a sale
        sale_amount = 5000.0
        response = requests.post(f"{BASE_URL}/api/brokers/{broker_id}/record-sale?amount={sale_amount}", headers=headers)
        assert response.status_code == 200, f"POST /api/brokers/{broker_id}/record-sale failed: {response.text}"
        
        updated_broker = response.json()
        assert updated_broker["total_sales"] == current_sales + sale_amount, "Sales not incremented correctly"
        assert updated_broker["total_deals"] == current_deals + 1, "Deals count not incremented"
        print(f"Recorded sale of ${sale_amount}. New total: ${updated_broker['total_sales']}")
    
    # DELETE /api/brokers/{broker_id} - Delete broker
    def test_08_delete_broker(self, headers):
        """Test DELETE /api/brokers/{id} deletes broker"""
        broker_id = getattr(TestBrokersAPI, 'created_broker_id', None)
        if not broker_id:
            pytest.skip("No broker created in previous test")
        
        response = requests.delete(f"{BASE_URL}/api/brokers/{broker_id}", headers=headers)
        assert response.status_code == 200, f"DELETE /api/brokers/{broker_id} failed: {response.text}"
        
        data = response.json()
        assert data.get("message") == "Broker deleted", "Unexpected response message"
        
        # Verify with GET - should return 404
        get_response = requests.get(f"{BASE_URL}/api/brokers/{broker_id}", headers=headers)
        assert get_response.status_code == 404, "Broker should not exist after deletion"
        print(f"Broker {broker_id} deleted successfully")
    
    # Test 404 for non-existent broker
    def test_09_get_nonexistent_broker(self, headers):
        """Test GET /api/brokers/{id} returns 404 for non-existent broker"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/brokers/{fake_id}", headers=headers)
        assert response.status_code == 404, f"Expected 404 for non-existent broker, got {response.status_code}"
        print("404 returned correctly for non-existent broker")
    
    # Test update 404
    def test_10_update_nonexistent_broker(self, headers):
        """Test PUT /api/brokers/{id} returns 404 for non-existent broker"""
        fake_id = str(uuid.uuid4())
        response = requests.put(f"{BASE_URL}/api/brokers/{fake_id}", json={"name": "Test"}, headers=headers)
        assert response.status_code == 404, f"Expected 404 for non-existent broker, got {response.status_code}"
        print("404 returned correctly for update non-existent broker")
    
    # Test delete 404
    def test_11_delete_nonexistent_broker(self, headers):
        """Test DELETE /api/brokers/{id} returns 404 for non-existent broker"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/brokers/{fake_id}", headers=headers)
        assert response.status_code == 404, f"Expected 404 for non-existent broker, got {response.status_code}"
        print("404 returned correctly for delete non-existent broker")


class TestAuthRequired:
    """Test authentication is required for brokers endpoints"""
    
    def test_get_brokers_without_auth(self):
        """Test GET /api/brokers requires authentication"""
        response = requests.get(f"{BASE_URL}/api/brokers")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("Authentication required for GET /api/brokers")
    
    def test_post_broker_without_auth(self):
        """Test POST /api/brokers requires authentication"""
        response = requests.post(f"{BASE_URL}/api/brokers", json={"name": "Test"})
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("Authentication required for POST /api/brokers")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
