import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { ClassType } from '../types/game';
import { ALL_CLASSES } from '../data/classes';

interface ClassSelectionScreenProps {
  onSelectClass: (classType: ClassType) => void;
}

export default function ClassSelectionScreen({ onSelectClass }: ClassSelectionScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">직업 선택</h1>
          <p className="text-xl text-gray-300">당신의 전투 스타일을 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_CLASSES.map((classInfo) => (
            <Card
              key={classInfo.id}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 hover:border-blue-500 transition-all hover:scale-105 cursor-pointer"
              onClick={() => onSelectClass(classInfo.id)}
            >
              <CardHeader className="text-center">
                <div className="text-7xl mb-4">{classInfo.emoji}</div>
                <CardTitle className="text-2xl text-white">{classInfo.name}</CardTitle>
                <CardDescription className="text-gray-400 text-base">
                  {classInfo.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 스탯 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-blue-400">시작 스탯</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">공격:</span>
                      <span className="text-white font-bold">{classInfo.startingStats.strength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">체력:</span>
                      <span className="text-white font-bold">{classInfo.startingStats.vitality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">민첩:</span>
                      <span className="text-white font-bold">{classInfo.startingStats.agility}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">방어:</span>
                      <span className="text-white font-bold">{classInfo.startingStats.defense}</span>
                    </div>
                  </div>
                </div>

                {/* 패시브 특성 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-purple-400">패시브 특성</h4>
                  <Badge className="w-full bg-purple-900/50 text-purple-200 border-purple-700">
                    {classInfo.passive.name}
                  </Badge>
                  <p className="text-xs text-gray-400">{classInfo.passive.description}</p>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  onClick={() => onSelectClass(classInfo.id)}
                >
                  선택하기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
