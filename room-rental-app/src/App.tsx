import { useState, useEffect } from 'react';
import {
  Layout, Menu, Typography, Row, Col, Card, Select, Input, InputNumber, Button, Modal, Upload, Form, message, Tabs
} from 'antd';
import { PlusOutlined, UploadOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import './App.css'; // Add this for custom styles
import './styles.css';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

type User = {
  username: string;
  password: string;
  role: 'customer' | 'renter';
};

type Room = {
  id: number;
  title: string;
  images: string[]; // base64 thumbnails
  location: string;
  cost: number;
  status: string;
  map: string;
  postedBy: string;
};

const initialRooms: Room[] = [];

function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  // Room state
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [filter, setFilter] = useState({
    status: '',
    location: '',
    minCost: undefined as number | undefined,
    maxCost: undefined as number | undefined,
  });
  const [modalOpen, setModalOpen] = useState(false);

  // Load users and rooms from localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) setUsers(JSON.parse(storedUsers));
    const storedRooms = localStorage.getItem('rooms');
    if (storedRooms) setRooms(JSON.parse(storedRooms));
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Save users and rooms to localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('rooms', JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    if (user) localStorage.setItem('currentUser', JSON.stringify(user));
    else localStorage.removeItem('currentUser');
  }, [user]);

  // Filter logic
  const filteredRooms = rooms.filter(room => {
    const statusMatch = filter.status ? room.status === filter.status : true;
    const locationMatch = filter.location
      ? room.location.toLowerCase().includes(filter.location.toLowerCase())
      : true;
    const minCostMatch = filter.minCost !== undefined ? room.cost >= filter.minCost : true;
    const maxCostMatch = filter.maxCost !== undefined ? room.cost <= filter.maxCost : true;
    return statusMatch && locationMatch && minCostMatch && maxCostMatch;
  });

  // Handle new room submission
  const handleAddRoom = (values: any) => {
    const newRoom: Room = {
      id: rooms.length + 1,
      title: values.title,
      images: (values.images?.fileList || []).slice(0, 5).map((file: any) =>
        file.thumbUrl || file.url || 'https://via.placeholder.com/300x200'
      ),
      location: values.location,
      cost: values.cost,
      status: values.status,
      map: values.map,
      postedBy: user?.username || '',
    };
    setRooms([newRoom, ...rooms]);
    setModalOpen(false);
    message.success('Room posted successfully!');
  };

  // Auth handlers
  const handleRegister = (values: any) => {
    if (users.find(u => u.username === values.username)) {
      message.error('Username already exists');
      return;
    }
    const newUser: User = {
      username: values.username,
      password: values.password,
      role: values.role,
    };
    setUsers([...users, newUser]);
    setUser(newUser);
    setAuthModal(null);
    message.success('Registered and logged in!');
  };

  const handleLogin = (values: any) => {
    const found = users.find(u => u.username === values.username && u.password === values.password);
    if (!found) {
      message.error('Invalid credentials');
      return;
    }
    setUser(found);
    setAuthModal(null);
    message.success('Logged in!');
  };

  const handleLogout = () => {
    setUser(null);
    message.info('Logged out');
  };

  // UI
  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
          <Menu mode="horizontal" selectable={false}>
            <Menu.Item key="login" onClick={() => setAuthModal('login')}>Login</Menu.Item>
            <Menu.Item key="register" onClick={() => setAuthModal('register')}>Register</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '32px 16px', maxWidth: 400, margin: 'auto' }}>
          <Title level={2} style={{ textAlign: 'center' }}>Welcome to Room Rental</Title>
          <p style={{ textAlign: 'center' }}>Please login or register to continue.</p>
          <Modal
            title={authModal === 'login' ? 'Login' : 'Register'}
            open={!!authModal}
            onCancel={() => setAuthModal(null)}
            footer={null}
            destroyOnClose
          >
            {authModal === 'login' ? (
              <LoginForm onFinish={handleLogin} />
            ) : (
              <RegisterForm onFinish={handleRegister} />
            )}
          </Modal>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #eee', boxShadow: '0 2px 8px #f0f1f2' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <img src="https://cdn-icons-png.flaticon.com/512/1946/1946436.png" alt="logo" style={{ height: 40, marginRight: 16 }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff', flex: 1 }}>Room Rental</Title>
          <Menu mode="horizontal" selectable={false} style={{ flex: 2, borderBottom: 'none', background: 'transparent' }}>
            <Menu.Item key="rooms">Browse Rooms</Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} style={{ float: 'right' }} onClick={handleLogout}>
              Logout ({user.username})
            </Menu.Item>
          </Menu>
        </div>
      </Header>
      <Content style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f6fa', padding: 0 }}>
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <Title level={1} style={{ color: '#fff', fontWeight: 700, fontSize: '2.5rem', marginBottom: 0 }}>
              Find Your Perfect Room
            </Title>
            <p style={{ color: '#fff', fontSize: '1.2rem', marginTop: 8 }}>
              Search and post rooms for rent easily and securely.
            </p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: 'auto', padding: '32px 8px', width: '100%' }}>
          <Row
            justify="space-between"
            align="middle"
            style={{
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <Col xs={24} sm={16}>
              <Title level={2} style={{ margin: 0, fontSize: '2rem', textAlign: 'left' }}>
                Peer-to-Peer Room Rental
              </Title>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
              {user.role === 'renter' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalOpen(true)}
                  style={{ width: '100%', maxWidth: 200 }}
                >
                  Post a Room
                </Button>
              )}
            </Col>
          </Row>
          <Tabs defaultActiveKey="1" tabBarGutter={24}>
            <TabPane tab="All Rooms" key="1">
              <RoomFilters filter={filter} setFilter={setFilter} />
              <RoomList rooms={filteredRooms} />
            </TabPane>
            {user.role === 'customer' && (
              <TabPane tab="My Bookings" key="2">
                <p>Feature coming soon...</p>
              </TabPane>
            )}
            {user.role === 'renter' && (
              <TabPane tab="My Rooms" key="3">
                <RoomList rooms={rooms.filter(r => r.postedBy === user.username)} />
              </TabPane>
            )}
          </Tabs>
          <Modal
            title="Post a Room"
            open={modalOpen}
            onCancel={() => setModalOpen(false)}
            footer={null}
            destroyOnClose
          >
            <RoomForm onFinish={handleAddRoom} />
          </Modal>
        </div>
      </Content>
    </Layout>
  );
}

// Room posting form
function RoomForm({ onFinish }: { onFinish: (values: any) => void }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  // Convert images to base64 for thumbnails
  const handleChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList.slice(0, 5));
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={values => onFinish({ ...values, images: { fileList } })}
      initialValues={{ status: 'Available' }}
    >
      <Form.Item name="title" label="Room Title" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item
        name="images"
        label="Room Images (up to 5)"
        valuePropName="fileList"
        getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
        rules={[{ required: true, message: 'Please upload at least one image' }]}
      >
        <Upload
          listType="picture-card"
          beforeUpload={file => {
            const reader = new FileReader();
            reader.onload = e => {
              setFileList(prev => [
                ...prev,
                { ...file, thumbUrl: e.target?.result as string }
              ].slice(0, 5));
            };
            reader.readAsDataURL(file);
            return false;
          }}
          fileList={fileList}
          onChange={handleChange}
          maxCount={5}
          multiple
        >
          {fileList.length >= 5 ? null : (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
      </Form.Item>
      <Form.Item name="location" label="Location" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="cost" label="Cost ($)" rules={[{ required: true, type: 'number', min: 0 }]}>
        <InputNumber style={{ width: '100%' }} min={0} />
      </Form.Item>
      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select>
          <Option value="Available">Available</Option>
          <Option value="Occupied">Occupied</Option>
        </Select>
      </Form.Item>
      <Form.Item name="map" label="Google Maps Link" rules={[{ required: true }]}>
        <Input placeholder="Paste Google Maps link" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Post Room
        </Button>
      </Form.Item>
    </Form>
  );
}

// Room filters
function RoomFilters({ filter, setFilter }: any) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Status"
          style={{ width: '100%' }}
          allowClear
          value={filter.status || undefined}
          onChange={value => setFilter({ ...filter, status: value || '' })}
        >
          <Option value="Available">Available</Option>
          <Option value="Occupied">Occupied</Option>
        </Select>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Location"
          value={filter.location}
          onChange={e => setFilter({ ...filter, location: e.target.value })}
        />
      </Col>
      <Col xs={12} sm={6} md={6}>
        <InputNumber
          placeholder="Min Cost"
          style={{ width: '100%' }}
          min={0}
          value={filter.minCost}
          onChange={value => setFilter({ ...filter, minCost: value || undefined })}
        />
      </Col>
      <Col xs={12} sm={6} md={6}>
        <InputNumber
          placeholder="Max Cost"
          style={{ width: '100%' }}
          min={0}
          value={filter.maxCost}
          onChange={value => setFilter({ ...filter, maxCost: value || undefined })}
        />
      </Col>
    </Row>
  );
}

// Room list
function RoomList({ rooms }: { rooms: Room[] }) {
  if (rooms.length === 0) return <Card>No rooms found.</Card>;
  return (
    <Row gutter={[16, 16]}>
      {rooms.map(room => (
        <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
          <Card
            hoverable
            cover={
              <img
                alt="room"
                src={room.images[0]}
                style={{
                  height: 180,
                  objectFit: 'cover',
                  width: '100%',
                  borderRadius: 8,
                }}
              />
            }
            style={{ borderRadius: 8 }}
            actions={[
              <a href={room.map} target="_blank" rel="noopener noreferrer" key="map">
                View on Map
              </a>,
            ]}
          >
            <Card.Meta
              title={room.title}
              description={
                <>
                  <div>Location: {room.location}</div>
                  <div>Cost: ${room.cost}</div>
                  <div>Status: {room.status}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {room.images.slice(1, 5).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="room"
                        width={40}
                        height={40}
                        style={{
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid #eee',
                        }}
                      />
                    ))}
                  </div>
                </>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// Login form
function LoginForm({ onFinish }: { onFinish: (values: any) => void }) {
  return (
    <Form layout="vertical" onFinish={onFinish}>
      <Form.Item name="username" label="Username" rules={[{ required: true }]}>
        <Input prefix={<UserOutlined />} />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Login
        </Button>
      </Form.Item>
    </Form>
  );
}

// Register form
function RegisterForm({ onFinish }: { onFinish: (values: any) => void }) {
  return (
    <Form layout="vertical" onFinish={onFinish}>
      <Form.Item name="username" label="Username" rules={[{ required: true }]}>
        <Input prefix={<UserOutlined />} />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item name="role" label="Register as" rules={[{ required: true }]}>
        <Select>
          <Option value="customer">Customer</Option>
          <Option value="renter">Renter</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Register
        </Button>
      </Form.Item>
    </Form>
  );
}

export default App;

/* Note: moved external font <link> tags and the large <style> block out of this TSX file because raw HTML/CSS at module scope causes TypeScript parse errors.
   Put font/link tags into public/index.html and the CSS into src/App.css or src/styles.css (you already import './App.css' and './styles.css'). */
