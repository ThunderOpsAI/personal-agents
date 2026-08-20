import { NextResponse } from 'next/server';
import { fetchAllPoses, getPoseById, getFilteredPoses } from '../../../../../lib/yoga-pose-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const pose = await getPoseById(id);
      if (!pose) {
        return NextResponse.json({ error: 'Pose not found' }, { status: 404 });
      }
      return NextResponse.json(pose);
    }

    const targetsParam = searchParams.get('targets');
    const excludeParam = searchParams.get('exclude');
    const difficulty = searchParams.get('difficulty');

    const targets = targetsParam ? targetsParam.split(',').map(t => t.trim()) : undefined;
    const excludeContraindications = excludeParam ? excludeParam.split(',').map(e => e.trim()) : undefined;

    if (targets || excludeContraindications || difficulty) {
      const filteredPoses = await getFilteredPoses({
        targets,
        excludeContraindications,
        difficulty: difficulty || undefined
      });
      return NextResponse.json(filteredPoses);
    }

    const poses = await fetchAllPoses();
    return NextResponse.json(poses);
  } catch (error) {
    console.error('Error fetching yoga poses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yoga poses' },
      { status: 500 }
    );
  }
}
