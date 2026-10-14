import { describe, expect, it, vi } from 'vitest';
import { CmsBlogAdminController } from '../src/bff/controllers/cms/CmsBlogAdminController.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import { sanitizeBlogHtml } from '../src/modules/cms/domain/sanitizeBlogHtml.js';

describe('blog admin authorization and pagination',()=>{
  it('strips executable HTML, dangerous schemes, remote image sources and event handlers',()=>{
    const html=sanitizeBlogHtml('<p onclick="run()">Safe <a href="javascript:alert(1)">link</a></p><img src="https://attacker.test/x.png" onerror="run()"><script>run()</script>');
    expect(html).toContain('<p>Safe <a>link</a></p>');
    expect(html).not.toContain('javascript:');expect(html).not.toContain('attacker.test');expect(html).not.toContain('onerror');expect(html).not.toContain('<script');
  });
  it('requires an administrator session and cms:read before returning drafts',async()=>{
    const identity={validateSession:vi.fn().mockImplementation(async(token:string)=>{
      if(token==='editor')return {actorId:'editor-id',actorType:'admin',mfaEnabled:true,permissions:['cms:read']};
      return {actorId:'customer-id',actorType:'customer',mfaEnabled:true,permissions:['cms:read']};
    })} as unknown as IdentityGateway;
    const cms={listBlogPosts:vi.fn().mockResolvedValue({items:[],total:0})} as unknown as CmsGateway;
    const app=CmsBlogAdminController.createRoutes(cms,identity,{} as any,{} as any);
    expect((await app.request('/api/v1/admin/cms/blog/posts')).status).toBe(401);
    expect((await app.request('/api/v1/admin/cms/blog/posts',{headers:{Authorization:'Bearer customer'}})).status).toBe(403);
    expect((await app.request('/api/v1/admin/cms/blog/posts?page=2&pageSize=10',{headers:{Authorization:'Bearer editor'}})).status).toBe(200);
    expect(cms.listBlogPosts).toHaveBeenCalledWith({page:2,pageSize:10,status:undefined});
    expect((await app.request('/api/v1/admin/cms/blog/posts?page=0&pageSize=500',{headers:{Authorization:'Bearer editor'}})).status).toBe(400);
  });
});
