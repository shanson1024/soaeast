import requests
import sys
import json
from datetime import datetime, timedelta

class SOAEastCRMTester:
    def __init__(self, base_url="https://emergent-crm-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_issues = []
        self.created_client_id = None
        self.created_product_id = None
        self.created_order_id = None
        self.created_deal_id = None

    def run_test(self, name, method, endpoint, expected_status=200, data=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   📋 {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {"message": "Success"}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   📄 Response: {error_detail}")
                except:
                    error_detail = response.text
                    print(f"   📄 Response: {error_detail}")
                
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "response": error_detail
                })
                
                # Mark critical issues
                if response.status_code >= 500 or endpoint in ['auth/login', 'seed']:
                    self.critical_issues.append({
                        "test": name,
                        "endpoint": endpoint,
                        "issue": f"Server error or critical endpoint failed - Status {response.status_code}",
                        "priority": "HIGH"
                    })
                    
                return False, error_detail

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout (30s)")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": "Request timeout"
            })
            return False, {"error": "timeout"}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {"error": str(e)}

    def test_seed_database(self):
        """Test database seeding"""
        print("\n" + "="*60)
        print("🌱 TESTING DATABASE SEEDING")
        print("="*60)
        
        success, response = self.run_test(
            "Seed Database",
            "POST",
            "seed",
            expected_status=200,
            description="Initialize database with sample data"
        )
        return success

    def test_authentication(self):
        """Test authentication flow"""
        print("\n" + "="*60)
        print("🔐 TESTING AUTHENTICATION")
        print("="*60)
        
        # Test login with default credentials
        login_data = {"email": "scott@soaeast.com", "password": "admin123"}
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            expected_status=200,
            data=login_data,
            description="Login with default credentials"
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   🎫 Token acquired for user: {self.user_data.get('name', 'Unknown')}")
        else:
            self.critical_issues.append({
                "test": "Authentication",
                "issue": "Cannot authenticate - will block all other tests",
                "priority": "CRITICAL"
            })
            return False

        # Test protected route - get user info
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            description="Verify token works with protected endpoint"
        )
        
        return success

    def test_clients_api(self):
        """Test client management APIs"""
        print("\n" + "="*60)
        print("👥 TESTING CLIENT MANAGEMENT")
        print("="*60)
        
        results = []
        
        # Get all clients
        success, clients = self.run_test(
            "Get All Clients",
            "GET",
            "clients",
            description="Fetch client list"
        )
        results.append(success)
        
        if success:
            print(f"   📊 Found {len(clients)} clients")
        
        # Test client filtering
        success, filtered = self.run_test(
            "Filter Clients by Status",
            "GET",
            "clients?status=active",
            description="Filter clients by active status"
        )
        results.append(success)
        
        # Create new client
        new_client = {
            "name": "Test Company",
            "email": "test@testcompany.com",
            "industry": "Technology",
            "tier": "new"
        }
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            expected_status=200,
            data=new_client,
            description="Create a new test client"
        )
        results.append(success)
        
        if success and 'id' in response:
            self.created_client_id = response['id']
            print(f"   🆔 Created client ID: {self.created_client_id}")
        
        return all(results)

    def test_products_api(self):
        """Test product management APIs"""
        print("\n" + "="*60)
        print("📦 TESTING PRODUCT MANAGEMENT")
        print("="*60)
        
        results = []
        
        # Get all products
        success, products = self.run_test(
            "Get All Products",
            "GET",
            "products",
            description="Fetch product catalog"
        )
        results.append(success)
        
        if success:
            print(f"   📊 Found {len(products)} products")
        
        # Test product filtering by category
        success, filtered = self.run_test(
            "Filter Products by Category",
            "GET",
            "products?category=apparel",
            description="Filter products by apparel category"
        )
        results.append(success)
        
        # Create new product
        new_product = {
            "name": "Test Product",
            "category": "apparel",
            "description": "Test promotional product",
            "base_price": 19.99,
            "badge": "new",
            "margin_percent": 35
        }
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            expected_status=200,
            data=new_product,
            description="Create a new test product"
        )
        results.append(success)
        
        if success and 'id' in response:
            self.created_product_id = response['id']
            print(f"   🆔 Created product ID: {self.created_product_id}")
        
        return all(results)

    def test_orders_api(self):
        """Test order management APIs"""
        print("\n" + "="*60)
        print("📋 TESTING ORDER MANAGEMENT")
        print("="*60)
        
        results = []
        
        # Get all orders
        success, orders = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            description="Fetch order list"
        )
        results.append(success)
        
        if success:
            print(f"   📊 Found {len(orders)} orders")
        
        # Create new order (if we have a client)
        if self.created_client_id:
            due_date = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
            new_order = {
                "client_id": self.created_client_id,
                "products_description": "100x Test Products",
                "amount": 1500.00,
                "status": "draft",
                "priority": "medium",
                "due_date": due_date
            }
            success, response = self.run_test(
                "Create Order",
                "POST",
                "orders",
                expected_status=200,
                data=new_order,
                description="Create a new test order"
            )
            results.append(success)
            
            if success and 'id' in response:
                self.created_order_id = response['id']
                print(f"   🆔 Created order ID: {self.created_order_id}")
        else:
            print("   ⚠️  Skipping order creation - no client available")
        
        return all(results)

    def test_deals_api(self):
        """Test deal/pipeline management APIs"""
        print("\n" + "="*60)
        print("🤝 TESTING PIPELINE MANAGEMENT")
        print("="*60)
        
        results = []
        
        # Get all deals
        success, deals = self.run_test(
            "Get All Deals",
            "GET",
            "deals",
            description="Fetch deals list"
        )
        results.append(success)
        
        if success:
            print(f"   📊 Found {len(deals)} deals")
        
        # Create new deal
        new_deal = {
            "client_name": "Test Deal Client",
            "amount": 5000.00,
            "product_description": "Test promotional package",
            "stage": "prospecting",
            "priority": "high",
            "tags": ["Tech", "Office"]
        }
        success, response = self.run_test(
            "Create Deal",
            "POST",
            "deals",
            expected_status=200,
            data=new_deal,
            description="Create a new test deal"
        )
        results.append(success)
        
        if success and 'id' in response:
            self.created_deal_id = response['id']
            print(f"   🆔 Created deal ID: {self.created_deal_id}")
            
            # Test deal stage update (drag-drop simulation)
            success, update_response = self.run_test(
                "Update Deal Stage",
                "PUT",
                f"deals/{self.created_deal_id}",
                expected_status=200,
                data={"stage": "proposal"},
                description="Move deal to proposal stage"
            )
            results.append(success)
        
        return all(results)

    def test_dashboard_apis(self):
        """Test dashboard analytics APIs"""
        print("\n" + "="*60)
        print("📊 TESTING DASHBOARD ANALYTICS")
        print("="*60)
        
        results = []
        
        # Get dashboard stats
        success, stats = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            description="Fetch KPI statistics"
        )
        results.append(success)
        
        if success:
            print(f"   💰 Total Revenue: ${stats.get('total_revenue', 0):,.2f}")
            print(f"   📦 Open Orders: {stats.get('open_orders', 0)}")
            print(f"   👥 New Clients: {stats.get('new_clients', 0)}")
        
        # Get pipeline summary
        success, pipeline = self.run_test(
            "Pipeline Summary",
            "GET",
            "dashboard/pipeline-summary",
            description="Fetch pipeline breakdown"
        )
        results.append(success)
        
        # Get sales trend data
        success, trend = self.run_test(
            "Sales Trend",
            "GET",
            "dashboard/sales-trend",
            description="Fetch sales trend chart data"
        )
        results.append(success)
        
        # Get recent deals
        success, recent = self.run_test(
            "Recent Deals",
            "GET",
            "dashboard/recent-deals",
            description="Fetch recent deals for table"
        )
        results.append(success)
        
        return all(results)

    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        print("\n" + "="*60)
        print("🧹 CLEANING UP TEST DATA")
        print("="*60)
        
        # Delete created entities in reverse order
        if self.created_deal_id:
            self.run_test("Delete Test Deal", "DELETE", f"deals/{self.created_deal_id}", expected_status=200)
            
        if self.created_order_id:
            self.run_test("Delete Test Order", "DELETE", f"orders/{self.created_order_id}", expected_status=200)
            
        if self.created_product_id:
            self.run_test("Delete Test Product", "DELETE", f"products/{self.created_product_id}", expected_status=200)
            
        if self.created_client_id:
            self.run_test("Delete Test Client", "DELETE", f"clients/{self.created_client_id}", expected_status=200)

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 SOA East LLC CRM - Backend API Test Suite")
        print("=" * 60)
        
        # Test database seeding first
        if not self.test_seed_database():
            print("⚠️  Database seeding failed, but continuing tests...")
        
        # Test authentication - critical for all other tests
        if not self.test_authentication():
            print("💥 Authentication failed - cannot proceed with protected routes")
            return False
        
        # Test all API endpoints
        all_passed = []
        all_passed.append(self.test_clients_api())
        all_passed.append(self.test_products_api())
        all_passed.append(self.test_orders_api())
        all_passed.append(self.test_deals_api())
        all_passed.append(self.test_dashboard_apis())
        
        # Cleanup test data
        self.cleanup_test_data()
        
        return all(all_passed)

    def print_summary(self):
        """Print test execution summary"""
        print("\n" + "="*60)
        print("📋 TEST SUMMARY")
        print("="*60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {len(self.failed_tests)}")
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES ({len(self.critical_issues)}):")
            for issue in self.critical_issues:
                print(f"   ⚠️  {issue['test']}: {issue['issue']}")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for failed in self.failed_tests[:5]:  # Show first 5 failures
                print(f"   🔸 {failed['test']} - {failed.get('endpoint', 'N/A')}")
        
        return success_rate

def main():
    tester = SOAEastCRMTester()
    
    # Run all tests
    overall_success = tester.run_all_tests()
    
    # Print summary
    success_rate = tester.print_summary()
    
    # Return exit code based on results
    if success_rate >= 90:
        print("\n🎉 All tests completed successfully!")
        return 0
    elif success_rate >= 70:
        print(f"\n⚠️  Tests completed with some issues ({success_rate:.1f}% success)")
        return 1
    else:
        print(f"\n💥 Multiple test failures ({success_rate:.1f}% success)")
        return 2

if __name__ == "__main__":
    sys.exit(main())