import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/lib/api';
import Builder from '@/pages/Builder';
import StudioLoading from '@/components/StudioLoading';
import ReferenceImageEditor, { REFERENCE_EDIT_STYLES } from '@/pages/ReferenceImageEditor';

export default function ImageToolRoute() {
  const { workflowId } = useParams();
  const {data:workflows, isLoading, isError} = useQuery({queryKey:['workflows'],queryFn:endpoints.listWorkflows});
  if (isLoading) return <StudioLoading label="Loading image tool…"/>;
  if (isError) return <p role="alert" className="p-6">Could not load image tools. <Link to="/tools">Return to Tools</Link></p>;
  const workflow = workflows?.find(item => item.id === workflowId);
  if (!workflow) return <p role="alert" className="p-6">This workflow is no longer available. <Link to="/tools">Choose another tool</Link></p>;
  return REFERENCE_EDIT_STYLES.includes(workflow.prompt_style)
    ? <ReferenceImageEditor key={workflowId} workflow={workflow}/>
    : <Builder key={workflowId} imageToolId={workflowId}/>;
}
