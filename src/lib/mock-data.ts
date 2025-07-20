import type { Restaurant, MenuItem, Order, CartItemType } from '@/types';

export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Healthy Bites Hospital Cafe',
    cuisine: 'Healthy, Sandwiches, Salads',
    distance: '0.2 km',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'healthy cafe',
    rating: 4.5,
    deliveryTime: '15-25 min',
    paymentQrCodeUrl: 'https://placehold.co/300x300.png?text=Merchant+QR+Healthy+Bites',
  },
  {
    id: '2',
    name: "Mama's Comfort Kitchen",
    cuisine: 'Homestyle, Soups, Local',
    distance: '0.5 km',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'comfort food',
    rating: 4.2,
    deliveryTime: '20-30 min',
    paymentQrCodeUrl: 'https://placehold.co/300x300.png?text=Merchant+QR+Mamas+Kitchen',
  },
  {
    id: '3',
    name: 'Quick Greens Salads',
    cuisine: 'Salads, Juices, Wraps',
    distance: '0.3 km',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'salad bar',
    rating: 4.8,
    deliveryTime: '10-20 min',
    paymentQrCodeUrl: 'https://placehold.co/300x300.png?text=Merchant+QR+Quick+Greens',
  },
  {
    id: '4',
    name: 'The Noodle House',
    cuisine: 'Asian, Noodles, Dumplings',
    distance: '0.8 km',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'noodle shop',
    rating: 4.0,
    deliveryTime: '25-35 min',
    paymentQrCodeUrl: 'https://placehold.co/300x300.png?text=Merchant+QR+Noodle+House',
  },
];

export const mockMenuItems: Record<string, MenuItem[]> = {
  '1': [ // Healthy Bites Hospital Cafe
    { id: '101', name: 'Grilled Chicken Salad', description: 'Fresh greens, grilled chicken, light vinaigrette.', price: 12.50, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'chicken salad', restaurantId: '1' },
    { id: '102', name: 'Vegetable Soup', description: 'Hearty and healthy vegetable soup.', price: 8.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'vegetable soup', restaurantId: '1' },
    { id: '103', name: 'Turkey Sandwich on Whole Wheat', description: 'Lean turkey, lettuce, tomato on whole wheat.', price: 9.50, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'turkey sandwich', restaurantId: '1' },
  ],
  '2': [ // Mama's Comfort Kitchen
    { id: '201', name: 'Chicken Noodle Soup', description: 'Classic comfort, homemade style.', price: 10.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'chicken soup', restaurantId: '2' },
    { id: '202', name: 'Mashed Potatoes & Gravy', description: 'Creamy mashed potatoes with rich gravy.', price: 6.50, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'mashed potatoes', restaurantId: '2' },
    { id: '203', name: 'Baked Mac & Cheese', description: 'Cheesy and delicious baked macaroni.', price: 11.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'mac cheese', restaurantId: '2' },
  ],
  '3': [ // Quick Greens Salads
    { id: '301', name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, Caesar dressing.', price: 11.50, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'caesar salad', restaurantId: '3' },
    { id: '302', name: 'Fresh Orange Juice', description: '100% freshly squeezed orange juice.', price: 5.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'orange juice', restaurantId: '3' },
    { id: '303', name: 'Chicken & Avocado Wrap', description: 'Grilled chicken, avocado, lettuce in a whole wheat wrap.', price: 13.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'chicken wrap', restaurantId: '3' },
  ],
   '4': [ // The Noodle House
    { id: '401', name: 'Ramen Noodles', description: 'Rich pork broth, noodles, chashu pork, egg.', price: 15.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'ramen noodles', restaurantId: '4' },
    { id: '402', name: 'Pork Dumplings (Steamed)', description: '6 pieces of steamed pork dumplings.', price: 9.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'pork dumplings', restaurantId: '4' },
    { id: '403', name: 'Vegetable Fried Rice', description: 'Stir-fried rice with mixed vegetables.', price: 12.00, imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'fried rice', restaurantId: '4' },
  ],
};

export const getRestaurantById = (id: string): Restaurant | undefined => {
  const restaurant = mockRestaurants.find(r => r.id === id);
  if (restaurant) {
    return { ...restaurant, menu: mockMenuItems[id] || [] };
  }
  return undefined;
};

export const getMenuItemById = (restaurantId: string, itemId: string): MenuItem | undefined => {
  return mockMenuItems[restaurantId]?.find(item => item.id === itemId);
}

// Mock orders - in a real app, this would be user-specific and stored in a database
export const mockOrders: Order[] = [
  {
    id: 'order123',
    items: [
      { ...mockMenuItems['1'][0], quantity: 1 } as CartItemType, // Grilled Chicken Salad
    ],
    totalAmount: 12.50,
    status: 'Delivered',
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    deliveryLocation: 'Room 101, Bed A',
    verificationCode: 'ABC123',
    restaurantName: 'Healthy Bites Hospital Cafe',
    restaurantId: '1',
    paymentQrCodeUrl: mockRestaurants[0].paymentQrCodeUrl,
  },
  {
    id: 'order456',
    items: [
      { ...mockMenuItems['2'][0], quantity: 2 } as CartItemType, // Chicken Noodle Soup
      { ...mockMenuItems['2'][1], quantity: 1 } as CartItemType, // Mashed Potatoes
    ],
    totalAmount: 26.50,
    status: 'Out for Delivery',
    orderDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    deliveryLocation: 'Room 205, Bed C',
    verificationCode: 'DEF456',
    restaurantName: "Mama's Comfort Kitchen",
    restaurantId: '2',
    paymentQrCodeUrl: mockRestaurants[1].paymentQrCodeUrl,
  },
];
