import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigate } from "react-router-dom";
import { Users, FolderOpen, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'member';
  created_at: string;
}

interface ContentSection {
  id: string;
  name: string;
  is_visible: boolean;
  created_at: string;
  items_count?: number;
}

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  order_index: number;
  section_id: string;
}

const Admin = () => {
  const { userRole, loading, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // 如果不是管理員，重定向到首頁
  if (!loading && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 載入用戶列表
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          created_at,
          user_roles!inner(role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: (user.user_roles as any)[0]?.role || 'member' as 'admin' | 'member',
        created_at: user.created_at
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "載入用戶失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 載入內容專區列表
  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('content_sections')
        .select(`
          *,
          content_items(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSections = data.map(section => ({
        ...section,
        items_count: section.content_items?.length || 0
      }));

      setSections(formattedSections);
    } catch (error: any) {
      toast({
        title: "載入專區失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 載入指定專區的內容項目
  const loadItems = async (sectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('section_id', sectionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "載入內容失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 更新用戶角色
  const updateUserRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "用戶角色已更新",
        description: `已成功更改為${newRole === 'admin' ? '管理員' : '會員'}`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "更新失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 新增/編輯專區
  const saveSection = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const isVisible = formData.get('is_visible') === 'on';
    const password = formData.get('password') as string;

    try {
      let sectionId = editingSection?.id;
      
      if (editingSection) {
        const { error } = await supabase
          .from('content_sections')
          .update({ name, is_visible: isVisible })
          .eq('id', editingSection.id);

        if (error) throw error;
        toast({ title: "專區已更新" });
      } else {
        const { data: newSection, error } = await supabase
          .from('content_sections')
          .insert([{ name, is_visible: isVisible }])
          .select()
          .single();

        if (error) throw error;
        sectionId = newSection.id;
        toast({ title: "專區已新增" });
      }

      // Handle password update/creation if provided
      if (password && sectionId) {
        const { error: passwordError } = await supabase
          .from('content_section_secrets')
          .upsert({ 
            section_id: sectionId, 
            password: password 
          });

        if (passwordError) {
          console.error('Password save error:', passwordError);
          toast({
            title: "密碼設定失敗",
            description: "專區已保存但密碼設定失敗",
            variant: "destructive",
          });
        }
      }

      setIsSectionDialogOpen(false);
      setEditingSection(null);
      loadSections();
    } catch (error: any) {
      toast({
        title: "操作失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 新增/編輯內容項目
  const saveItem = async (formData: FormData) => {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const url = formData.get('url') as string;

    if (!selectedSection) return;

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('content_items')
          .update({ title, description, url })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "內容已更新" });
      } else {
        const { error } = await supabase
          .from('content_items')
          .insert([{ 
            title, 
            description, 
            url, 
            section_id: selectedSection,
            order_index: items.length
          }]);

        if (error) throw error;
        toast({ title: "內容已新增" });
      }

      setIsItemDialogOpen(false);
      setEditingItem(null);
      loadItems(selectedSection);
    } catch (error: any) {
      toast({
        title: "操作失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 刪除專區
  const deleteSection = async (sectionId: string) => {
    if (!confirm('確定要刪除此專區嗎？這將同時刪除所有相關內容。')) return;

    try {
      const { error } = await supabase
        .from('content_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      
      toast({ title: "專區已刪除" });
      loadSections();
      if (selectedSection === sectionId) {
        setSelectedSection(null);
        setItems([]);
      }
    } catch (error: any) {
      toast({
        title: "刪除失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 刪除內容項目
  const deleteItem = async (itemId: string) => {
    if (!confirm('確定要刪除此內容嗎？')) return;

    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast({ title: "內容已刪除" });
      if (selectedSection) {
        loadItems(selectedSection);
      }
    } catch (error: any) {
      toast({
        title: "刪除失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      loadUsers();
      loadSections();
    }
  }, [userRole]);

  useEffect(() => {
    if (selectedSection) {
      loadItems(selectedSection);
    }
  }, [selectedSection]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">管理員面板</h1>
          <p className="text-muted-foreground">管理用戶和內容專區</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>用戶管理</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4" />
              <span>內容管理</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用戶管理</CardTitle>
                <CardDescription>管理所有用戶的角色和權限</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>電子郵件</TableHead>
                      <TableHead>顯示名稱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>註冊時間</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>{userData.display_name || '未設定'}</TableCell>
                        <TableCell>
                          <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                            {userData.role === 'admin' ? '管理員' : '會員'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(userData.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {userData.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserRole(
                                userData.id, 
                                userData.role === 'admin' ? 'member' : 'admin'
                              )}
                            >
                              {userData.role === 'admin' ? '降為會員' : '升為管理員'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 專區管理 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>內容專區</CardTitle>
                    <CardDescription>管理所有內容專區</CardDescription>
                  </div>
                  <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingSection(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        新增專區
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSection ? '編輯專區' : '新增專區'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        saveSection(formData);
                      }}>
                         <div className="space-y-4">
                           <div>
                             <Label htmlFor="name">專區名稱</Label>
                             <Input
                               id="name"
                               name="name"
                               defaultValue={editingSection?.name || ''}
                               required
                             />
                           </div>
                           <div>
                             <Label htmlFor="password">專區密碼（選填）</Label>
                             <Input
                               id="password"
                               name="password"
                               type="password"
                               placeholder="設定專區解鎖密碼"
                             />
                             <p className="text-xs text-muted-foreground mt-1">
                               留空表示不需要密碼即可查看此專區
                             </p>
                           </div>
                           <div className="flex items-center space-x-2">
                             <Switch
                               id="is_visible"
                               name="is_visible"
                               defaultChecked={editingSection?.is_visible ?? true}
                             />
                             <Label htmlFor="is_visible">公開顯示</Label>
                           </div>
                         </div>
                        <DialogFooter className="mt-6">
                          <Button type="submit">
                            {editingSection ? '更新' : '新增'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedSection === section.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedSection(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {section.is_visible ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="font-medium">{section.name}</span>
                            </div>
                            <Badge variant="outline">
                              {section.items_count} 項目
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSection(section);
                                setIsSectionDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSection(section.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 內容項目管理 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>內容項目</CardTitle>
                    <CardDescription>
                      {selectedSection ? '管理選中專區的內容' : '請先選擇一個專區'}
                    </CardDescription>
                  </div>
                  {selectedSection && (
                    <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setEditingItem(null)}>
                          <Plus className="w-4 h-4 mr-2" />
                          新增內容
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingItem ? '編輯內容' : '新增內容'}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          saveItem(formData);
                        }}>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="title">標題</Label>
                              <Input
                                id="title"
                                name="title"
                                defaultValue={editingItem?.title || ''}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="description">描述</Label>
                              <Textarea
                                id="description"
                                name="description"
                                defaultValue={editingItem?.description || ''}
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="url">連結</Label>
                              <Input
                                id="url"
                                name="url"
                                type="url"
                                defaultValue={editingItem?.url || ''}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <Button type="submit">
                              {editingItem ? '更新' : '新增'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedSection ? (
                    <div className="space-y-3">
                      {items.length > 0 ? (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{item.title}</h4>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {item.url}
                                </a>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsItemDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          此專區暫無內容
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      請先選擇一個專區以查看內容
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;