class OrderTracking {
    constructor() {
        this.trackingStatuses = {
            'pending': 'Order Pending',
            'accepted': 'Order Accepted',
            'pickup_scheduled': 'Pickup Scheduled',
            'picked_up': 'Picked Up from Company',
            'in_transit': 'In Transit',
            'delivered_to_pharmabridge': 'Delivered to Pharma Bridge',
            'quality_check': 'Quality Check in Progress',
            'ready_for_ngo': 'Ready for NGO Pickup',
            'dispatched_to_ngo': 'Dispatched to NGO',
            'delivered_to_ngo': 'Delivered to NGO'
        };
    }

    async getOrderStatus(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch order status');
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching order status:', error);
            throw error;
        }
    }

    createTrackingUI(status, container, timestamps = {}) {
        const statuses = Object.keys(this.trackingStatuses);
        const currentIndex = statuses.indexOf(status);
        
        const trackingHtml = `
            <div class="tracking-container">
                <div class="tracking-timeline">
                    ${statuses.map((step, index) => `
                        <div class="tracking-step ${index <= currentIndex ? 'completed' : ''}">
                            <div class="step-icon">
                                <i class="fas ${this.getStepIcon(step)}"></i>
                            </div>
                            <div class="step-info">
                                <span class="step-title">${this.trackingStatuses[step]}</span>
                                ${timestamps[step] ? `<span class="step-date">${new Date(timestamps[step]).toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = trackingHtml;
    }

    getStepIcon(status) {
        const icons = {
            'pending': 'fa-clock',
            'accepted': 'fa-check-circle',
            'pickup_scheduled': 'fa-calendar-check',
            'picked_up': 'fa-box',
            'in_transit': 'fa-truck',
            'delivered_to_pharmabridge': 'fa-warehouse',
            'quality_check': 'fa-microscope',
            'ready_for_ngo': 'fa-box-open',
            'dispatched_to_ngo': 'fa-shipping-fast',
            'delivered_to_ngo': 'fa-handshake'
        };
        return icons[status] || 'fa-circle';
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) throw new Error('Failed to update order status');
            
            return await response.json();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    async getOrderDetails(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch order details');
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw error;
        }
    }
}

// Initialize tracking functionality
const tracking = new OrderTracking();

document.addEventListener('DOMContentLoaded', async () => {
    const trackingContainer = document.querySelector('.tracking-container');
    if (trackingContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        
        if (orderId) {
            try {
                const orderData = await tracking.getOrderStatus(orderId);
                tracking.createTrackingUI(orderData.status, trackingContainer, orderData.timestamps || {});

                // Real-time updates using WebSocket
                const ws = new WebSocket(`ws://${window.location.host}/ws/tracking/${orderId}`);
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'status_update') {
                        tracking.createTrackingUI(data.status, trackingContainer, data.timestamps || {});
                    }
                };
            } catch (error) {
                trackingContainer.innerHTML = '<p class="error">Failed to load tracking information</p>';
            }
        }
    }
});