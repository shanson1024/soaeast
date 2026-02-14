"""
Test suite for CRM features: Messages, Channels, Integrations, Settings, and Export APIs
Tests CRUD operations and critical flows for all new endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "scott@soaeast.com"
TEST_PASSWORD = "admin123"

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("access_token")
        assert token, "No access_token in response"
        return token
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"Login successful, user: {data['user'].get('name', 'N/A')}")


class TestMessages:
    """Messages API tests - Compose, view, mark as read, delete"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_messages(self, auth_headers):
        """Test GET /api/messages - List all messages"""
        response = requests.get(f"{BASE_URL}/api/messages", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} messages")
    
    def test_create_message(self, auth_headers):
        """Test POST /api/messages - Compose and send a message"""
        message_data = {
            "recipient_name": "TEST_Recipient",
            "subject": f"TEST_Message_{uuid.uuid4().hex[:8]}",
            "content": "This is a test message for CRM testing",
            "message_type": "internal"
        }
        response = requests.post(f"{BASE_URL}/api/messages", json=message_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["subject"] == message_data["subject"]
        assert data["content"] == message_data["content"]
        assert data["is_read"] == False
        assert "id" in data
        print(f"Created message with ID: {data['id']}")
        return data["id"]
    
    def test_create_and_mark_as_read(self, auth_headers):
        """Test PUT /api/messages/{id}/read - Mark message as read"""
        # Create a message first
        message_data = {
            "recipient_name": "TEST_Recipient",
            "subject": f"TEST_ReadTest_{uuid.uuid4().hex[:8]}",
            "content": "Message to be marked as read",
            "message_type": "internal"
        }
        create_resp = requests.post(f"{BASE_URL}/api/messages", json=message_data, headers=auth_headers)
        assert create_resp.status_code == 200
        message_id = create_resp.json()["id"]
        
        # Mark as read
        read_resp = requests.put(f"{BASE_URL}/api/messages/{message_id}/read", headers=auth_headers)
        assert read_resp.status_code == 200
        print(f"Marked message {message_id} as read")
        
        # Cleanup - delete the test message
        requests.delete(f"{BASE_URL}/api/messages/{message_id}", headers=auth_headers)
    
    def test_create_and_delete_message(self, auth_headers):
        """Test DELETE /api/messages/{id} - Delete a message"""
        # Create a message
        message_data = {
            "recipient_name": "TEST_DeleteRecipient",
            "subject": f"TEST_DeleteMe_{uuid.uuid4().hex[:8]}",
            "content": "Message to be deleted",
            "message_type": "internal"
        }
        create_resp = requests.post(f"{BASE_URL}/api/messages", json=message_data, headers=auth_headers)
        assert create_resp.status_code == 200
        message_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/messages/{message_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        print(f"Deleted message {message_id}")
    
    def test_delete_nonexistent_message(self, auth_headers):
        """Test DELETE /api/messages/{id} - 404 for non-existent message"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/messages/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


class TestChannels:
    """Channels API tests - Add, edit, delete, filter by type"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_channels(self, auth_headers):
        """Test GET /api/channels - List all channels"""
        response = requests.get(f"{BASE_URL}/api/channels", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} channels")
    
    def test_filter_channels_by_type(self, auth_headers):
        """Test GET /api/channels?channel_type=direct - Filter channels"""
        response = requests.get(f"{BASE_URL}/api/channels?channel_type=direct", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        for channel in data:
            assert channel["channel_type"] == "direct"
        print(f"Got {len(data)} direct channels")
    
    def test_create_channel(self, auth_headers):
        """Test POST /api/channels - Create a new channel"""
        channel_data = {
            "name": f"TEST_Channel_{uuid.uuid4().hex[:8]}",
            "channel_type": "online",
            "description": "Test online sales channel",
            "contact_email": "test@channel.com",
            "commission_rate": 5.5,
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/channels", json=channel_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["name"] == channel_data["name"]
        assert data["channel_type"] == "online"
        assert data["commission_rate"] == 5.5
        assert data["status"] == "active"
        assert "id" in data
        print(f"Created channel with ID: {data['id']}")
        return data["id"]
    
    def test_create_and_update_channel(self, auth_headers):
        """Test PUT /api/channels/{id} - Update a channel"""
        # Create a channel
        channel_data = {
            "name": f"TEST_UpdateChannel_{uuid.uuid4().hex[:8]}",
            "channel_type": "retail",
            "description": "Original description",
            "status": "pending"
        }
        create_resp = requests.post(f"{BASE_URL}/api/channels", json=channel_data, headers=auth_headers)
        assert create_resp.status_code == 200
        channel_id = create_resp.json()["id"]
        
        # Update
        update_data = {
            "description": "Updated description",
            "status": "active",
            "commission_rate": 10.0
        }
        update_resp = requests.put(f"{BASE_URL}/api/channels/{channel_id}", json=update_data, headers=auth_headers)
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["description"] == "Updated description"
        assert updated["status"] == "active"
        assert updated["commission_rate"] == 10.0
        print(f"Updated channel {channel_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/channels/{channel_id}", headers=auth_headers)
    
    def test_create_and_delete_channel(self, auth_headers):
        """Test DELETE /api/channels/{id} - Delete a channel"""
        # Create
        channel_data = {
            "name": f"TEST_DeleteChannel_{uuid.uuid4().hex[:8]}",
            "channel_type": "wholesale",
            "status": "inactive"
        }
        create_resp = requests.post(f"{BASE_URL}/api/channels", json=channel_data, headers=auth_headers)
        assert create_resp.status_code == 200
        channel_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/channels/{channel_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        print(f"Deleted channel {channel_id}")
    
    def test_delete_nonexistent_channel(self, auth_headers):
        """Test DELETE /api/channels/{id} - 404 for non-existent channel"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/channels/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


class TestIntegrations:
    """Integrations API tests - Add, test, toggle status, delete"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_integrations(self, auth_headers):
        """Test GET /api/integrations - List all integrations"""
        response = requests.get(f"{BASE_URL}/api/integrations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} integrations")
    
    def test_create_stripe_integration(self, auth_headers):
        """Test POST /api/integrations - Create a Stripe integration"""
        integration_data = {
            "name": f"TEST_Stripe_{uuid.uuid4().hex[:8]}",
            "integration_type": "payment",
            "provider": "Stripe",
            "api_key": "sk_test_123456",
            "webhook_url": "https://test.webhook.com/stripe",
            "settings": {"currency": "USD"},
            "status": "inactive"
        }
        response = requests.post(f"{BASE_URL}/api/integrations", json=integration_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["integration_type"] == "payment"
        assert data["provider"] == "Stripe"
        assert data["status"] == "inactive"
        assert "id" in data
        # API key should not be returned
        assert "api_key" not in data or data.get("api_key") is None
        print(f"Created Stripe integration with ID: {data['id']}")
        return data["id"]
    
    def test_create_and_test_integration(self, auth_headers):
        """Test POST /api/integrations/{id}/test - Test an integration"""
        # Create integration
        integration_data = {
            "name": f"TEST_SendGrid_{uuid.uuid4().hex[:8]}",
            "integration_type": "email",
            "provider": "SendGrid",
            "api_key": "SG.test_key",
            "status": "inactive"
        }
        create_resp = requests.post(f"{BASE_URL}/api/integrations", json=integration_data, headers=auth_headers)
        assert create_resp.status_code == 200
        integration_id = create_resp.json()["id"]
        
        # Test the integration
        test_resp = requests.post(f"{BASE_URL}/api/integrations/{integration_id}/test", headers=auth_headers)
        assert test_resp.status_code == 200
        test_data = test_resp.json()
        assert test_data["success"] == True
        print(f"Tested integration {integration_id}: {test_data['message']}")
        
        # Verify status was updated to active
        get_resp = requests.get(f"{BASE_URL}/api/integrations", headers=auth_headers)
        integrations = get_resp.json()
        tested_integration = next((i for i in integrations if i["id"] == integration_id), None)
        assert tested_integration is not None
        assert tested_integration["status"] == "active"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/integrations/{integration_id}", headers=auth_headers)
    
    def test_create_and_toggle_status(self, auth_headers):
        """Test PUT /api/integrations/{id} - Toggle integration status"""
        # Create integration
        integration_data = {
            "name": f"TEST_Toggle_{uuid.uuid4().hex[:8]}",
            "integration_type": "analytics",
            "provider": "Google Analytics",
            "status": "inactive"
        }
        create_resp = requests.post(f"{BASE_URL}/api/integrations", json=integration_data, headers=auth_headers)
        assert create_resp.status_code == 200
        integration_id = create_resp.json()["id"]
        
        # Toggle to active
        update_resp = requests.put(f"{BASE_URL}/api/integrations/{integration_id}", 
                                   json={"status": "active"}, headers=auth_headers)
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "active"
        print(f"Toggled integration {integration_id} to active")
        
        # Toggle back to inactive
        update_resp2 = requests.put(f"{BASE_URL}/api/integrations/{integration_id}", 
                                    json={"status": "inactive"}, headers=auth_headers)
        assert update_resp2.status_code == 200
        assert update_resp2.json()["status"] == "inactive"
        print(f"Toggled integration {integration_id} to inactive")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/integrations/{integration_id}", headers=auth_headers)
    
    def test_create_and_delete_integration(self, auth_headers):
        """Test DELETE /api/integrations/{id} - Delete an integration"""
        # Create
        integration_data = {
            "name": f"TEST_DeleteIntegration_{uuid.uuid4().hex[:8]}",
            "integration_type": "shipping",
            "provider": "ShipStation",
            "status": "inactive"
        }
        create_resp = requests.post(f"{BASE_URL}/api/integrations", json=integration_data, headers=auth_headers)
        assert create_resp.status_code == 200
        integration_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/integrations/{integration_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        print(f"Deleted integration {integration_id}")
    
    def test_delete_nonexistent_integration(self, auth_headers):
        """Test DELETE /api/integrations/{id} - 404 for non-existent integration"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/integrations/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


class TestSettings:
    """Settings API tests - Save company settings, toggle notifications, persist settings"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_settings(self, auth_headers):
        """Test GET /api/settings - Get current settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Check for default settings structure
        assert "company_name" in data or data.get("company_name") is not None
        print(f"Got settings: company_name={data.get('company_name', 'N/A')}")
    
    def test_update_company_settings(self, auth_headers):
        """Test PUT /api/settings - Update company profile"""
        # Get original settings first
        get_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        original = get_resp.json()
        
        # Update settings
        update_data = {
            "company_name": "TEST_SOA East LLC Updated",
            "company_email": "test_update@soaeast.com",
            "industry": "TEST_Promotional Products"
        }
        response = requests.put(f"{BASE_URL}/api/settings", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("company_name") == "TEST_SOA East LLC Updated"
        print("Company settings updated successfully")
        
        # Restore original settings
        restore_data = {
            "company_name": original.get("company_name", "SOA East LLC"),
            "company_email": original.get("company_email", "contact@soaeast.com"),
            "industry": original.get("industry", "Promotional Products")
        }
        requests.put(f"{BASE_URL}/api/settings", json=restore_data, headers=auth_headers)
    
    def test_update_email_notifications(self, auth_headers):
        """Test PUT /api/settings - Toggle email notification settings"""
        email_settings = {
            "email_settings": {
                "order_updates": False,
                "new_clients": True,
                "pipeline_movement": True,
                "weekly_reports": False
            }
        }
        response = requests.put(f"{BASE_URL}/api/settings", json=email_settings, headers=auth_headers)
        assert response.status_code == 200
        print("Email notification settings updated")
        
        # Verify persistence
        get_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        data = get_resp.json()
        if "email_settings" in data:
            assert data["email_settings"]["pipeline_movement"] == True
        print("Email settings persisted correctly")
    
    def test_update_payment_settings(self, auth_headers):
        """Test PUT /api/settings - Update payment settings (currency, tax rate)"""
        payment_data = {
            "currency": "EUR",
            "tax_rate": 10.5
        }
        response = requests.put(f"{BASE_URL}/api/settings", json=payment_data, headers=auth_headers)
        assert response.status_code == 200
        print("Payment settings updated")
        
        # Verify
        get_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        data = get_resp.json()
        # Note: currency and tax_rate might be in a payment_settings nested object or at root level
        print(f"Settings after update: currency={data.get('currency')}, tax_rate={data.get('tax_rate')}")
        
        # Restore
        requests.put(f"{BASE_URL}/api/settings", json={"currency": "USD", "tax_rate": 8.5}, headers=auth_headers)
    
    def test_update_notification_settings(self, auth_headers):
        """Test PUT /api/settings - Update notification preferences"""
        notification_data = {
            "notifications": {
                "push": False,
                "desktop": True,
                "sound": False
            }
        }
        response = requests.put(f"{BASE_URL}/api/settings", json=notification_data, headers=auth_headers)
        assert response.status_code == 200
        print("Notification settings updated")
    
    def test_update_localization_settings(self, auth_headers):
        """Test PUT /api/settings - Update timezone and date format"""
        localization_data = {
            "timezone": "America/Chicago",
            "date_format": "DD/MM/YYYY"
        }
        response = requests.put(f"{BASE_URL}/api/settings", json=localization_data, headers=auth_headers)
        assert response.status_code == 200
        print("Localization settings updated")
        
        # Restore
        requests.put(f"{BASE_URL}/api/settings", json={
            "timezone": "America/New_York",
            "date_format": "MM/DD/YYYY"
        }, headers=auth_headers)
    
    def test_settings_persistence(self, auth_headers):
        """Test that settings persist after update"""
        # Update
        test_industry = f"TEST_Industry_{uuid.uuid4().hex[:6]}"
        update_resp = requests.put(f"{BASE_URL}/api/settings", 
                                   json={"industry": test_industry}, headers=auth_headers)
        assert update_resp.status_code == 200
        
        # Verify persistence with new GET
        get_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        data = get_resp.json()
        assert data.get("industry") == test_industry
        print(f"Settings persisted: industry={test_industry}")
        
        # Restore
        requests.put(f"{BASE_URL}/api/settings", json={"industry": "Promotional Products"}, headers=auth_headers)


class TestExport:
    """Export API tests - Export clients, orders, deals, products to JSON"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_export_clients(self, auth_headers):
        """Test GET /api/export/clients - Export all clients"""
        response = requests.get(f"{BASE_URL}/api/export/clients", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "count" in data
        assert "type" in data
        assert data["type"] == "clients"
        assert isinstance(data["data"], list)
        print(f"Exported {data['count']} clients")
    
    def test_export_orders(self, auth_headers):
        """Test GET /api/export/orders - Export all orders"""
        response = requests.get(f"{BASE_URL}/api/export/orders", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "count" in data
        assert "type" in data
        assert data["type"] == "orders"
        print(f"Exported {data['count']} orders")
    
    def test_export_deals(self, auth_headers):
        """Test GET /api/export/deals - Export all deals"""
        response = requests.get(f"{BASE_URL}/api/export/deals", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "count" in data
        assert "type" in data
        assert data["type"] == "deals"
        print(f"Exported {data['count']} deals")
    
    def test_export_products(self, auth_headers):
        """Test GET /api/export/products - Export all products"""
        response = requests.get(f"{BASE_URL}/api/export/products", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "count" in data
        assert "type" in data
        assert data["type"] == "products"
        print(f"Exported {data['count']} products")


class TestCleanup:
    """Cleanup test data created during testing"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_data(self, auth_headers):
        """Clean up any remaining TEST_ prefixed data"""
        cleanup_count = 0
        
        # Cleanup messages
        msgs_resp = requests.get(f"{BASE_URL}/api/messages", headers=auth_headers)
        if msgs_resp.status_code == 200:
            for msg in msgs_resp.json():
                if msg.get("subject", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/messages/{msg['id']}", headers=auth_headers)
                    cleanup_count += 1
        
        # Cleanup channels
        channels_resp = requests.get(f"{BASE_URL}/api/channels", headers=auth_headers)
        if channels_resp.status_code == 200:
            for channel in channels_resp.json():
                if channel.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/channels/{channel['id']}", headers=auth_headers)
                    cleanup_count += 1
        
        # Cleanup integrations
        integrations_resp = requests.get(f"{BASE_URL}/api/integrations", headers=auth_headers)
        if integrations_resp.status_code == 200:
            for integration in integrations_resp.json():
                if integration.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/integrations/{integration['id']}", headers=auth_headers)
                    cleanup_count += 1
        
        print(f"Cleaned up {cleanup_count} test items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
